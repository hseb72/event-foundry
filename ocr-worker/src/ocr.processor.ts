import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { ImportRequest, OCRResult } from '@event-foundry/contracts';
import { AI_OCR_ENGINE_FACTORY, type AiOcrEngineFactory } from './engine/ai-ocr-engine';
import { DOCUMENT_LOADER, type DocumentLoader } from './interfaces/document-loader.interface';
import { IMAGE_PROCESSOR, type ImageProcessor } from './interfaces/image-processor.interface';
import { OCR_ENGINE, type OcrEngine, type OcrEngineResult } from './interfaces/ocr-engine.interface';
import {
  OCR_LEXICON_PROVIDER,
  type ReferenceLexiconProvider,
} from './reference/reference-lexicon-provider.interface';
import { correctWithLexicon } from './processing/lexicon-corrector';
import { OcrPostProcessor } from './processing/ocr-post-processor';

/**
 * Orchestre le pipeline interne (TSPEC.04) :
 * Document Loader -> Image Preprocessor -> OCR Engine (multi-passes) -> Post Processor
 * -> Correction lexicale (référentiels) -> OCRResult.
 * Ne connaît aucun élément métier ; ne dépend que d'abstractions et de shared/contracts.
 */
@Injectable()
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);
  private readonly lexiconCorrection = process.env.OCR_LEXICON_CORRECTION !== 'false';

  constructor(
    @Inject(DOCUMENT_LOADER) private readonly loader: DocumentLoader,
    @Inject(IMAGE_PROCESSOR) private readonly imageProcessor: ImageProcessor,
    @Inject(OCR_ENGINE) private readonly engine: OcrEngine,
    private readonly postProcessor: OcrPostProcessor,
    @Optional() @Inject(OCR_LEXICON_PROVIDER) private readonly lexicon?: ReferenceLexiconProvider,
    @Optional() @Inject(AI_OCR_ENGINE_FACTORY) private readonly aiEngineFactory?: AiOcrEngineFactory,
  ) {}

  async process(request: ImportRequest): Promise<OCRResult> {
    const startedAt = Date.now();
    const document = await this.loader.load(request.attachmentId);
    const variants = await this.imageProcessor.preprocess(document.buffer, document.contentType);

    // 1er cas d'usage IA (ADR.16) : si le Backend a résolu un assistant OCR, on l'utilise ; en cas
    // d'échec (indisponible, format inattendu…), repli déterministe sur l'OCR interne (RG-AI-06).
    let best: OcrEngineResult | null = null;
    let bestLabel = '';
    if (request.ocrAssistant && this.aiEngineFactory) {
      try {
        const aiEngine = this.aiEngineFactory.forAssistant(request.ocrAssistant);
        ({ best, bestLabel } = await this.recognizeBest(aiEngine, variants));
        this.logger.log(`OCR assisté par IA (${request.ocrAssistant.provider}).`);
      } catch (error) {
        this.logger.warn(
          `IA OCR indisponible, repli sur l'OCR interne : ${(error as Error).message}`,
        );
        best = null;
      }
    }
    if (!best) {
      ({ best, bestLabel } = await this.recognizeBest(this.engine, variants));
    }
    if (!best) {
      throw new Error('Aucune variante de prétraitement à traiter.');
    }

    const cleaned = this.postProcessor.process(best.text);
    const rawText = await this.applyLexiconCorrection(cleaned);

    this.logger.log(
      `OCR variantes=${variants.length} retenue=${bestLabel} ` +
        `confiance=${best.confidence.toFixed(2)}`,
    );

    return {
      importJobId: request.importJobId,
      rawText,
      confidence: best.confidence,
      processingTimeMs: Date.now() - startedAt,
      pageCount: 1,
      language: best.language,
      engine: best.engine,
      engineVersion: best.engineVersion,
      correlationId: request.correlationId,
    };
  }

  /** OCR multi-passes déterministe : retient la variante à la meilleure confiance. */
  private async recognizeBest(
    engine: OcrEngine,
    variants: { label: string; buffer: Buffer }[],
  ): Promise<{ best: OcrEngineResult | null; bestLabel: string }> {
    let best: OcrEngineResult | null = null;
    let bestLabel = '';
    for (const variant of variants) {
      const recognized = await engine.recognize(variant.buffer);
      if (!best || recognized.confidence > best.confidence) {
        best = recognized;
        bestLabel = variant.label;
      }
    }
    return { best, bestLabel };
  }

  /**
   * Rapproche les mots océrisés des termes des référentiels (levier 3). Purement défensif :
   * lexique indisponible ou correction désactivée ⇒ texte inchangé.
   */
  private async applyLexiconCorrection(text: string): Promise<string> {
    if (!this.lexiconCorrection || !this.lexicon) {
      return text;
    }
    try {
      const words = await this.lexicon.getWords();
      if (words.length === 0) {
        return text;
      }
      const { text: corrected, corrections } = correctWithLexicon(text, words);
      if (corrections > 0) {
        this.logger.log(`Correction lexicale : ${corrections} mot(s) rapproché(s) des référentiels.`);
      }
      return corrected;
    } catch (error) {
      this.logger.warn(`Correction lexicale ignorée : ${(error as Error).message}`);
      return text;
    }
  }
}

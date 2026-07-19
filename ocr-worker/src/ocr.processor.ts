import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { ImportRequest, OCRResult } from '@event-foundry/contracts';
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
  ) {}

  async process(request: ImportRequest): Promise<OCRResult> {
    const startedAt = Date.now();
    const document = await this.loader.load(request.attachmentId);
    const variants = await this.imageProcessor.preprocess(document.buffer, document.contentType);

    // Multi-passes déterministe : OCR de chaque variante, on retient la meilleure confiance.
    let best: OcrEngineResult | null = null;
    let bestLabel = '';
    for (const variant of variants) {
      const recognized = await this.engine.recognize(variant.buffer);
      if (!best || recognized.confidence > best.confidence) {
        best = recognized;
        bestLabel = variant.label;
      }
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

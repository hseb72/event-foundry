import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ImportRequest, OCRResult } from '@event-foundry/contracts';
import { DOCUMENT_LOADER, type DocumentLoader } from './interfaces/document-loader.interface';
import { IMAGE_PROCESSOR, type ImageProcessor } from './interfaces/image-processor.interface';
import { OCR_ENGINE, type OcrEngine, type OcrEngineResult } from './interfaces/ocr-engine.interface';
import { OcrPostProcessor } from './processing/ocr-post-processor';

/**
 * Orchestre le pipeline interne (TSPEC.04) :
 * Document Loader -> Image Preprocessor -> OCR Engine -> OCR Post Processor -> OCRResult.
 * Ne connaît aucun élément métier ; ne dépend que d'abstractions et de shared/contracts.
 */
@Injectable()
export class OcrProcessor {
  private readonly logger = new Logger(OcrProcessor.name);

  constructor(
    @Inject(DOCUMENT_LOADER) private readonly loader: DocumentLoader,
    @Inject(IMAGE_PROCESSOR) private readonly imageProcessor: ImageProcessor,
    @Inject(OCR_ENGINE) private readonly engine: OcrEngine,
    private readonly postProcessor: OcrPostProcessor,
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

    this.logger.log(
      `OCR variantes=${variants.length} retenue=${bestLabel} ` +
        `confiance=${best.confidence.toFixed(2)}`,
    );

    return {
      importJobId: request.importJobId,
      rawText: this.postProcessor.process(best.text),
      confidence: best.confidence,
      processingTimeMs: Date.now() - startedAt,
      pageCount: 1,
      language: best.language,
      engine: best.engine,
      engineVersion: best.engineVersion,
      correlationId: request.correlationId,
    };
  }
}

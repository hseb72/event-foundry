import { Inject, Injectable } from '@nestjs/common';
import type { ImportRequest, OCRResult } from '@event-foundry/contracts';
import { DOCUMENT_LOADER, type DocumentLoader } from './interfaces/document-loader.interface';
import { IMAGE_PROCESSOR, type ImageProcessor } from './interfaces/image-processor.interface';
import { OCR_ENGINE, type OcrEngine } from './interfaces/ocr-engine.interface';
import { OcrPostProcessor } from './processing/ocr-post-processor';

/**
 * Orchestre le pipeline interne (TSPEC.04) :
 * Document Loader -> Image Preprocessor -> OCR Engine -> OCR Post Processor -> OCRResult.
 * Ne connaît aucun élément métier ; ne dépend que d'abstractions et de shared/contracts.
 */
@Injectable()
export class OcrProcessor {
  constructor(
    @Inject(DOCUMENT_LOADER) private readonly loader: DocumentLoader,
    @Inject(IMAGE_PROCESSOR) private readonly imageProcessor: ImageProcessor,
    @Inject(OCR_ENGINE) private readonly engine: OcrEngine,
    private readonly postProcessor: OcrPostProcessor,
  ) {}

  async process(request: ImportRequest): Promise<OCRResult> {
    const startedAt = Date.now();
    const document = await this.loader.load(request.attachmentId);
    const preprocessed = await this.imageProcessor.preprocess(document.buffer, document.contentType);
    const recognized = await this.engine.recognize(preprocessed);
    const rawText = this.postProcessor.process(recognized.text);

    return {
      importJobId: request.importJobId,
      rawText,
      confidence: recognized.confidence,
      processingTimeMs: Date.now() - startedAt,
      pageCount: 1,
      language: recognized.language,
      engine: recognized.engine,
      engineVersion: recognized.engineVersion,
      correlationId: request.correlationId,
    };
  }
}

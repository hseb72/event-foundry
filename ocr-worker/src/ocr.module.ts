import { Module } from '@nestjs/common';
import { TesseractOcrEngine } from './engine/tesseract-ocr-engine';
import { DOCUMENT_LOADER } from './interfaces/document-loader.interface';
import { IMAGE_PROCESSOR } from './interfaces/image-processor.interface';
import { OCR_ENGINE } from './interfaces/ocr-engine.interface';
import { MinioDocumentLoader } from './loaders/minio-document-loader';
import { OcrProcessor } from './ocr.processor';
import { SharpImageProcessor } from './processing/sharp-image-processor';
import { OcrPostProcessor } from './processing/ocr-post-processor';
import { OcrResultPublisher } from './publisher/ocr-result-publisher';
import { OcrWorker } from './worker';

/**
 * Câblage du worker OCR (NestJS Standalone). Les implémentations concrètes sont liées à
 * leurs abstractions via des tokens : elles peuvent être remplacées sans toucher au reste.
 */
@Module({
  providers: [
    { provide: DOCUMENT_LOADER, useClass: MinioDocumentLoader },
    { provide: IMAGE_PROCESSOR, useClass: SharpImageProcessor },
    { provide: OCR_ENGINE, useClass: TesseractOcrEngine },
    OcrPostProcessor,
    OcrProcessor,
    OcrResultPublisher,
    OcrWorker,
  ],
})
export class OcrModule {}

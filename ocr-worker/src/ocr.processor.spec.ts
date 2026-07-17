import type { DocumentLoader } from './interfaces/document-loader.interface';
import type { ImageProcessor } from './interfaces/image-processor.interface';
import type { OcrEngine } from './interfaces/ocr-engine.interface';
import { OcrProcessor } from './ocr.processor';
import { OcrPostProcessor } from './processing/ocr-post-processor';

describe('OcrProcessor', () => {
  it('produit un OCRResult, nettoie le texte et propage le correlationId', async () => {
    const loader = {
      load: jest.fn().mockResolvedValue({ buffer: Buffer.from('img'), contentType: 'image/png' }),
    };
    const imageProcessor = {
      preprocess: jest.fn().mockResolvedValue(Buffer.from('img')),
    };
    const engine = {
      recognize: jest.fn().mockResolvedValue({
        text: '  Concert  Jazz \r\n\r\n\r\n au Sunset ',
        confidence: 0.91,
        language: 'fra',
        engine: 'tesseract',
        engineVersion: 'tesseract.js@5',
      }),
    };

    const processor = new OcrProcessor(
      loader as unknown as DocumentLoader,
      imageProcessor as unknown as ImageProcessor,
      engine as unknown as OcrEngine,
      new OcrPostProcessor(),
    );

    const result = await processor.process({
      importJobId: 'job-1',
      attachmentId: 'att-1',
      correlationId: 'corr-1',
    });

    expect(loader.load).toHaveBeenCalledWith('att-1');
    expect(result.importJobId).toBe('job-1');
    expect(result.correlationId).toBe('corr-1');
    expect(result.engine).toBe('tesseract');
    expect(result.pageCount).toBe(1);
    expect(result.rawText).toBe('Concert Jazz\n\nau Sunset');
  });
});

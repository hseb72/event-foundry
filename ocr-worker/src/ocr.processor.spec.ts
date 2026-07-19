import type { DocumentLoader } from './interfaces/document-loader.interface';
import type { ImageProcessor } from './interfaces/image-processor.interface';
import type { OcrEngine, OcrEngineResult } from './interfaces/ocr-engine.interface';
import { OcrProcessor } from './ocr.processor';
import { OcrPostProcessor } from './processing/ocr-post-processor';

function engineResult(text: string, confidence: number): OcrEngineResult {
  return { text, confidence, language: 'fra', engine: 'tesseract', engineVersion: 'tesseract.js@7' };
}

function build(
  engine: OcrEngine,
  imageProcessor: ImageProcessor,
  words?: string[],
): OcrProcessor {
  const loader = {
    load: jest.fn().mockResolvedValue({ buffer: Buffer.from('img'), contentType: 'image/png' }),
  };
  const lexicon = words ? { getWords: jest.fn().mockResolvedValue(words) } : undefined;
  return new OcrProcessor(
    loader as unknown as DocumentLoader,
    imageProcessor,
    engine,
    new OcrPostProcessor(),
    lexicon,
  );
}

describe('OcrProcessor', () => {
  it('produit un OCRResult, nettoie le texte et propage le correlationId', async () => {
    const engine = {
      recognize: jest
        .fn()
        .mockResolvedValue(engineResult('  Concert  Jazz \r\n\r\n\r\n au Sunset ', 0.91)),
    };
    const imageProcessor = {
      preprocess: jest
        .fn()
        .mockResolvedValue([{ label: 'grayscale-normalized', buffer: Buffer.from('x') }]),
    };

    const result = await build(engine as unknown as OcrEngine, imageProcessor).process({
      importJobId: 'job-1',
      attachmentId: 'att-1',
      correlationId: 'corr-1',
    });

    expect(result.importJobId).toBe('job-1');
    expect(result.correlationId).toBe('corr-1');
    expect(result.engine).toBe('tesseract');
    expect(result.pageCount).toBe(1);
    expect(result.rawText).toBe('Concert Jazz\n\nau Sunset');
  });

  it('retient la variante de meilleure confiance (multi-passes)', async () => {
    const engine = {
      recognize: jest
        .fn()
        .mockResolvedValueOnce(engineResult('texte faible', 0.32))
        .mockResolvedValueOnce(engineResult('TEXTE NET', 0.88)),
    };
    const imageProcessor = {
      preprocess: jest.fn().mockResolvedValue([
        { label: 'grayscale-normalized', buffer: Buffer.from('a') },
        { label: 'binarized', buffer: Buffer.from('b') },
      ]),
    };

    const result = await build(engine as unknown as OcrEngine, imageProcessor).process({
      importJobId: 'job-2',
      attachmentId: 'att-2',
      correlationId: 'corr-2',
    });

    expect(engine.recognize).toHaveBeenCalledTimes(2);
    expect(result.rawText).toBe('TEXTE NET');
    expect(result.confidence).toBeCloseTo(0.88);
  });

  it('applique la correction lexicale des référentiels (levier 3)', async () => {
    const engine = {
      recognize: jest.fn().mockResolvedValue(engineResult('Tournoi a la Boutioue', 0.8)),
    };
    const imageProcessor = {
      preprocess: jest.fn().mockResolvedValue([{ label: 'grayscale-normalized', buffer: Buffer.from('x') }]),
    };

    const result = await build(engine as unknown as OcrEngine, imageProcessor, ['Boutique']).process({
      importJobId: 'job-3',
      attachmentId: 'att-3',
      correlationId: 'corr-3',
    });

    expect(result.rawText).toBe('Tournoi a la Boutique');
  });
});

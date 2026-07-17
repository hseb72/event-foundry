export const OCR_ENGINE = 'OCR_ENGINE';

export interface OcrEngineResult {
  text: string;
  /** Confiance normalisée (0..1). */
  confidence: number;
  language: string;
  engine: string;
  engineVersion: string;
}

/**
 * Moteur OCR. Le worker dépend de cette abstraction, jamais directement de Tesseract
 * (ADR.07).
 */
export interface OcrEngine {
  recognize(image: Buffer): Promise<OcrEngineResult>;
}

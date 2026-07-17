export const IMAGE_PROCESSOR = 'IMAGE_PROCESSOR';

/**
 * Prétraitement d'image avant OCR. Le moteur dépend de cette abstraction, jamais
 * directement d'une bibliothèque de traitement d'image (ADR.07).
 */
export interface ImageProcessor {
  /** Retourne les octets prétraités, prêts pour l'OCR. */
  preprocess(input: Buffer, contentType: string): Promise<Buffer>;
}

export const IMAGE_PROCESSOR = 'IMAGE_PROCESSOR';

/** Une variante de prétraitement, prête pour l'OCR. Le label sert à la traçabilité. */
export interface PreprocessedVariant {
  /** Identifiant lisible de la stratégie (ex. « grayscale-normalized », « binarized »). */
  label: string;
  buffer: Buffer;
}

/**
 * Prétraitement d'image avant OCR. Le moteur dépend de cette abstraction, jamais
 * directement d'une bibliothèque de traitement d'image (ADR.07).
 *
 * `preprocess` renvoie une ou plusieurs variantes : l'OCR est tenté sur chacune et la
 * meilleure (confiance) est retenue (multi-passes déterministe, TSPEC.04).
 */
export interface ImageProcessor {
  preprocess(input: Buffer, contentType: string): Promise<PreprocessedVariant[]>;
}

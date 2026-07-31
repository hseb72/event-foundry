/**
 * Résultat produit par l'OCR Worker, unique dépendance du Classifier Worker.
 * Le Worker ne connaît aucun élément métier.
 * Référence : TSPEC.03, TSPEC.04.
 */
export interface OCRResult {
  importJobId: string;
  rawText: string;
  /** Confiance OCR globale (0..1). */
  confidence: number;
  processingTimeMs: number;
  pageCount: number;
  /** Langue détectée / utilisée (ex. "fra", "eng"). */
  language: string;
  /** Moteur OCR (ex. "tesseract"). */
  engine: string;
  engineVersion: string;
  correlationId: string;
}

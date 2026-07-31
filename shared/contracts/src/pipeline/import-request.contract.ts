/**
 * Assistant IA résolu pour l'extraction (OCR) — ADR.16 / TSPEC.07. Résolu par le Backend au moment
 * de l'enqueue (fallback organisation → utilisateur → plateforme) car le Worker est découplé de
 * PostgreSQL et ne peut pas résoudre les secrets. La valeur est éphémère dans le job (file interne).
 * Absent = OCR interne déterministe (Tesseract).
 */
export interface OcrAssistant {
  provider: string;
  model: string;
  apiKey: string;
}

/**
 * Contrat publié par le Backend sur OCR_QUEUE.
 * Volontairement minimal : le Worker recharge ensuite toutes les données nécessaires.
 * Référence : TSPEC.03.
 */
export interface ImportRequest {
  importJobId: string;
  attachmentId: string;
  correlationId: string;
  /** Assistant IA optionnel pour remplacer l'OCR interne (1er cas d'usage — ADR.16). */
  ocrAssistant?: OcrAssistant;
}

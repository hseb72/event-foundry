// Énumérations métier
export * from './enums/import-job-status.enum';
export * from './enums/event-candidate-status.enum';
export * from './enums/event-source.enum';
export * from './enums/reservation-status.enum';
export * from './enums/payment-status.enum';
export * from './enums/attachment-type.enum';

// Contrats du pipeline d'import
export * from './pipeline/import-request.contract';
export * from './pipeline/ocr-result.contract';
export * from './pipeline/classification-result.contract';

// Constantes partagées : noms des files BullMQ (TSPEC.01).
// Le Backend orchestre chaque étape (règle d'or 4) : les Workers ne se chaînent jamais
// entre eux, ils renvoient leur résultat au Backend qui décide de l'étape suivante et
// enregistre chaque transition d'état de l'ImportJob.
// - OCR          : Backend -> OCR Worker (demande d'OCR).
// - OCR_RESULT   : OCR Worker -> Backend (OCRResult produit).
// - CLASSIFICATION : Backend -> Classifier Worker (OCRResult à classer).
// - RESULT       : Classifier Worker -> Backend (ClassificationResult -> EventCandidate).
export const QUEUES = {
  OCR: 'OCR_QUEUE',
  OCR_RESULT: 'OCR_RESULT_QUEUE',
  CLASSIFICATION: 'CLASSIFICATION_QUEUE',
  RESULT: 'IMPORT_RESULT_QUEUE',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

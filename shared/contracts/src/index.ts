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

// Constantes partagées : noms des files BullMQ (TSPEC.01)
// - OCR / CLASSIFICATION : étapes du pipeline (Backend -> Workers)
// - RESULT : ClassificationResult renvoyé au Backend pour créer l'EventCandidate
export const QUEUES = {
  OCR: 'OCR_QUEUE',
  CLASSIFICATION: 'CLASSIFICATION_QUEUE',
  RESULT: 'IMPORT_RESULT_QUEUE',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

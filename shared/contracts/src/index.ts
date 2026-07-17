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
export const QUEUES = {
  OCR: 'OCR_QUEUE',
  CLASSIFICATION: 'CLASSIFICATION_QUEUE',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

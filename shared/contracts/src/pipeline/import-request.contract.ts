/**
 * Contrat publié par le Backend sur OCR_QUEUE.
 * Volontairement minimal : le Worker recharge ensuite toutes les données nécessaires.
 * Référence : TSPEC.03.
 */
export interface ImportRequest {
  importJobId: string;
  attachmentId: string;
  correlationId: string;
}

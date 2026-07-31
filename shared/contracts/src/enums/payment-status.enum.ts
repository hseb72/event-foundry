/**
 * Statut de paiement d'une UserParticipation.
 * Indépendant de `interested` et de `reservationStatus` (aucune déduction automatique).
 * Référence : FSPEC.06.
 */
export enum PaymentStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

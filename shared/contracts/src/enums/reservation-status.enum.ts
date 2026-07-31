/**
 * Statut de réservation d'une UserParticipation.
 * Indépendant de `interested` et de `paymentStatus` (aucune déduction automatique).
 * Référence : FSPEC.06.
 */
export enum ReservationStatus {
  NONE = 'NONE',
  RESERVED = 'RESERVED',
  WAITLIST = 'WAITLIST',
  CANCELLED = 'CANCELLED',
}

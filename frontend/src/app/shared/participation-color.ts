import { ParticipationState } from '../core/models';

/** Statut de participation dominant (palette V1). NONE = aucune qualification. */
export type ParticipationKind = 'PAID' | 'CANCELLED' | 'WAITLIST' | 'RESERVED' | 'INTERESTED' | 'NONE';

/** Réduit les trois axes à un statut dominant (même précédence que la couleur/le libellé). */
export function participationKind(participation: ParticipationState | null): ParticipationKind {
  if (!participation) {
    return 'NONE';
  }
  if (participation.paymentStatus === 'PAID') {
    return 'PAID';
  }
  if (participation.reservationStatus === 'CANCELLED') {
    return 'CANCELLED';
  }
  if (participation.reservationStatus === 'WAITLIST') {
    return 'WAITLIST';
  }
  if (participation.reservationStatus === 'RESERVED') {
    return 'RESERVED';
  }
  if (participation.interested) {
    return 'INTERESTED';
  }
  return 'NONE';
}

/** Palette V1 : couleur et libellé par statut dominant (source unique pour légende/filtre). */
export const PARTICIPATION_PALETTE: { kind: ParticipationKind; label: string; color: string }[] = [
  { kind: 'INTERESTED', label: 'Intéressé', color: 'var(--blue)' },
  { kind: 'RESERVED', label: 'Réservé', color: 'var(--orange)' },
  { kind: 'WAITLIST', label: "Liste d'attente", color: 'var(--violet)' },
  { kind: 'PAID', label: 'Payé', color: 'var(--green)' },
  { kind: 'CANCELLED', label: 'Annulé', color: 'var(--red)' },
];

/**
 * Précédence de couleur pour la V1 (palette FSPEC.05). La précédence est un choix UI :
 * l'API renvoie l'état brut des trois axes.
 */
export function participationColor(participation: ParticipationState | null): string {
  if (!participation) {
    return 'transparent';
  }
  if (participation.paymentStatus === 'PAID') {
    return 'var(--green)';
  }
  if (participation.reservationStatus === 'CANCELLED') {
    return 'var(--red)';
  }
  if (participation.reservationStatus === 'WAITLIST') {
    return 'var(--violet)';
  }
  if (participation.reservationStatus === 'RESERVED') {
    return 'var(--orange)';
  }
  if (participation.interested) {
    return 'var(--blue)';
  }
  return 'transparent';
}

export function participationLabel(participation: ParticipationState | null): string {
  if (!participation) {
    return '';
  }
  if (participation.paymentStatus === 'PAID') {
    return 'Payé';
  }
  if (participation.reservationStatus === 'CANCELLED') {
    return 'Annulé';
  }
  if (participation.reservationStatus === 'WAITLIST') {
    return "Liste d'attente";
  }
  if (participation.reservationStatus === 'RESERVED') {
    return 'Réservé';
  }
  if (participation.interested) {
    return 'Intéressé';
  }
  return '';
}

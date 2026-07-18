import { ParticipationState } from '../core/models';

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

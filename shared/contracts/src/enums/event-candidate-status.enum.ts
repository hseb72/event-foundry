/**
 * Cycle de vie d'un EventCandidate.
 * Transitions autorisées :
 *   PENDING   -> CORRECTED | VALIDATED | REJECTED
 *   CORRECTED -> VALIDATED | REJECTED
 * Un candidate VALIDATED ou REJECTED n'est plus modifiable (conservé pour audit).
 * Référence : ARCHI.02 (Domain), FSPEC.02.
 */
export enum EventCandidateStatus {
  PENDING = 'PENDING',
  CORRECTED = 'CORRECTED',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

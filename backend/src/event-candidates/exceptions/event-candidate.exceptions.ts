import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import type { SubmissionAnomaly } from '../submission/submission-controls';

/** EventCandidate introuvable (HTTP 404). */
export class EventCandidateNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`EventCandidate introuvable : ${id}.`);
  }
}

/**
 * Transition de statut interdite (HTTP 409). Un candidate VALIDATED ou REJECTED n'est plus
 * modifiable (FSPEC.02).
 */
export class InvalidCandidateTransitionException extends ConflictException {
  constructor(currentStatus: string) {
    super(`Action impossible : l'EventCandidate est déjà « ${currentStatus} ».`);
  }
}

/**
 * Validation retenue par les contrôles automatiques (FSPEC.22 §13, HTTP 422) : une anomalie a été
 * détectée, une Case a été ouverte pour intervention Operator. Le Draft reste modifiable (l'auteur
 * peut corriger puis re-valider). Les autres Drafts de la même soumission ne sont pas affectés.
 */
export class SubmissionHeldForReviewException extends UnprocessableEntityException {
  constructor(caseReference: string, anomalies: SubmissionAnomaly[]) {
    super({
      statusCode: 422,
      code: 'SUBMISSION_HELD_FOR_REVIEW',
      message:
        `La validation est retenue pour vérification (dossier ${caseReference}). ` +
        anomalies.map((a) => a.message).join(' '),
      caseReference,
      anomalies: anomalies.map((a) => ({ kind: a.kind, message: a.message })),
    });
  }
}

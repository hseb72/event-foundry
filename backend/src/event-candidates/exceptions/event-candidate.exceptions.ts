import { ConflictException, NotFoundException } from '@nestjs/common';

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

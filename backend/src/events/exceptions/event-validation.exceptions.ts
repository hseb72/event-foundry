import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

/** L'EventType ne correspond pas à l'Activity indiquée (HTTP 422). */
export class InvalidEventTypeException extends UnprocessableEntityException {
  constructor(eventTypeId: string) {
    super(`L'EventType ${eventTypeId} n'appartient pas à l'Activity indiquée.`);
  }
}

/** Event introuvable (HTTP 404). */
export class EventNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Event introuvable : ${id}.`);
  }
}

/** Un ou plusieurs Tags indiqués n'existent pas (HTTP 422). */
export class InvalidTagsException extends UnprocessableEntityException {
  constructor(tagIds: string[]) {
    super(`Tags introuvables : ${tagIds.join(', ')}.`);
  }
}

/** Le fichier fourni n'est pas une image acceptée (HTTP 422). */
export class InvalidMediaTypeException extends UnprocessableEntityException {
  constructor(contentType: string) {
    super(`Type de média non supporté : ${contentType}. Seules les images sont acceptées.`);
  }
}

/** Média introuvable pour cet Event (HTTP 404). */
export class EventMediaNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Média introuvable : ${id}.`);
  }
}

/** Transition de statut non autorisée par le workflow de publication (HTTP 422). */
export class InvalidStatusTransitionException extends UnprocessableEntityException {
  constructor(from: string, to: string) {
    super(`Transition de statut interdite : ${from} → ${to}.`);
  }
}

/** L'Event ne satisfait pas les règles de publication (HTTP 422). */
export class EventNotPublishableException extends UnprocessableEntityException {
  constructor(reason: string) {
    super(`Publication impossible : ${reason}.`);
  }
}

/**
 * L'Event n'est pas modifiable dans son état courant (HTTP 409). Seuls les brouillons et les
 * événements soumis sont éditables ; un événement publié doit d'abord être dépublié, un événement
 * archivé restauré.
 */
export class EventNotEditableException extends ConflictException {
  constructor(status: string) {
    super(
      `Modification impossible : un événement au statut ${status} n'est pas éditable. ` +
        `Dépubliez-le (ou restaurez-le) pour le modifier.`,
    );
  }
}

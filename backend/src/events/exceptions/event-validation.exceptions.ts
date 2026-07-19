import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';

/** L'EventType ne correspond pas à l'Activity indiquée (HTTP 422). */
export class InvalidEventTypeException extends UnprocessableEntityException {
  constructor(eventTypeId: string) {
    super(`L'EventType ${eventTypeId} n'appartient pas à l'Activity indiquée.`);
  }
}

/** L'EventFormat ne correspond pas à l'Activity indiquée (HTTP 422). */
export class InvalidEventFormatException extends UnprocessableEntityException {
  constructor(eventFormatId: string) {
    super(`L'EventFormat ${eventFormatId} n'appartient pas à l'Activity indiquée.`);
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

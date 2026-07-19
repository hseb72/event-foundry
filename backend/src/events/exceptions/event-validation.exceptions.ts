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

import { NotFoundException } from '@nestjs/common';

/** Erreurs métier explicites des référentiels (HTTP 404) — TSPEC.01. */

export class DomainNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Domain introuvable : ${id}.`);
  }
}

export class ActivityNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Activity introuvable : ${id}.`);
  }
}

export class EventTypeNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`EventType introuvable : ${id}.`);
  }
}

export class EventFormatNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`EventFormat introuvable : ${id}.`);
  }
}

export class OrganizerNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Organizer introuvable : ${id}.`);
  }
}

export class VenueNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Venue introuvable : ${id}.`);
  }
}

export class AliasNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Alias introuvable : ${id}.`);
  }
}

export class CountryNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Country introuvable : ${id}.`);
  }
}

export class RegionNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Region introuvable : ${id}.`);
  }
}

export class MunicipalityNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Municipality introuvable : ${id}.`);
  }
}

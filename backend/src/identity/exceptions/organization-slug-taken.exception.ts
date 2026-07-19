import { ConflictException } from '@nestjs/common';

/** Erreur métier : le slug d'organisation est déjà utilisé (HTTP 409). */
export class OrganizationSlugTakenException extends ConflictException {
  constructor(slug: string) {
    super(`Une organisation existe déjà avec le slug « ${slug} ».`);
  }
}

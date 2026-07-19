import { NotFoundException } from '@nestjs/common';

/** Erreur métier : organisation cible introuvable (HTTP 404). */
export class OrganizationNotFoundException extends NotFoundException {
  constructor(organizationId: string) {
    super(`Organisation introuvable : ${organizationId}.`);
  }
}

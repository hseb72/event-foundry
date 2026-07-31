import { ConflictException } from '@nestjs/common';

/**
 * Erreur métier : l'utilisateur n'appartient pas à l'organisation demandée, il ne peut donc pas
 * l'activer comme contexte (métier → 409, TSPEC.07).
 */
export class OrganizationNotAccessibleException extends ConflictException {
  constructor(organizationId: string) {
    super(`Organisation « ${organizationId} » inaccessible : aucune appartenance.`);
  }
}

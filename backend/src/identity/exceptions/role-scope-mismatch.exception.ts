import { UnprocessableEntityException } from '@nestjs/common';

/**
 * Erreur métier : on tente d'affecter un rôle dans un contexte incompatible avec sa portée
 * (ex. un rôle d'ORGANISATION affecté au niveau plateforme, ou l'inverse) — HTTP 422 (TSPEC.07).
 */
export class RoleScopeMismatchException extends UnprocessableEntityException {
  constructor(roleName: string, expected: string) {
    super(`Le rôle « ${roleName} » ne peut pas être affecté à ce niveau (portée attendue : ${expected}).`);
  }
}

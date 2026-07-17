import { InternalServerErrorException } from '@nestjs/common';

/**
 * Erreur technique : un rôle système attendu est absent (HTTP 500).
 * Signale généralement un seed non exécuté.
 */
export class RoleNotFoundException extends InternalServerErrorException {
  constructor(roleName: string) {
    super(`Rôle système introuvable : « ${roleName} ». Le seed a-t-il été exécuté ?`);
  }
}

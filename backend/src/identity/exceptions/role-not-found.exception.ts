import { NotFoundException } from '@nestjs/common';

/** Erreur métier : le rôle demandé n'existe pas (HTTP 404). */
export class RoleNotFoundException extends NotFoundException {
  constructor(roleName: string) {
    super(`Rôle introuvable : « ${roleName} ».`);
  }
}

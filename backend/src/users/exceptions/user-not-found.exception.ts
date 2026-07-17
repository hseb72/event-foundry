import { NotFoundException } from '@nestjs/common';

/** Erreur métier : utilisateur introuvable (HTTP 404). */
export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Utilisateur introuvable : ${identifier}.`);
  }
}

import { NotFoundException } from '@nestjs/common';

/** Erreur métier : utilisateur cible introuvable pour une opération d'identité (HTTP 404). */
export class IdentityUserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`Utilisateur introuvable : ${userId}.`);
  }
}

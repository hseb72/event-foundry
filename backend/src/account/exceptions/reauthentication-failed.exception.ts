import { UnauthorizedException } from '@nestjs/common';

/** Réauthentification requise pour une opération sensible (IAM-008) : mot de passe actuel invalide. */
export class ReauthenticationFailedException extends UnauthorizedException {
  constructor() {
    super('Mot de passe actuel incorrect.');
  }
}

import { UnauthorizedException } from '@nestjs/common';

/**
 * Identifiants invalides (HTTP 401). Message volontairement générique pour ne pas
 * révéler l'existence d'un compte (anti-énumération).
 */
export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Identifiants invalides.');
  }
}

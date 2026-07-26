import { UnauthorizedException } from '@nestjs/common';

/**
 * Second facteur requis pour finaliser la connexion (FSPEC.18 §MFA). Le corps porte un code stable
 * `MFA_REQUIRED` pour que le client distingue ce cas d'un échec d'identifiants et demande le code TOTP.
 */
export class MfaRequiredException extends UnauthorizedException {
  constructor() {
    super({ statusCode: 401, code: 'MFA_REQUIRED', message: 'Code d’authentification à deux facteurs requis.' });
  }
}

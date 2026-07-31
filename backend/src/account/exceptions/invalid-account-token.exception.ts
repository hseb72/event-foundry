import { UnprocessableEntityException } from '@nestjs/common';

/** Jeton de compte invalide, expiré ou déjà consommé (IAM-005). Message volontairement neutre. */
export class InvalidAccountTokenException extends UnprocessableEntityException {
  constructor() {
    super('Lien invalide ou expiré. Demandez un nouveau lien.');
  }
}

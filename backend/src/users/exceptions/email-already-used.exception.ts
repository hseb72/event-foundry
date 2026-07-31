import { ConflictException } from '@nestjs/common';

/** Erreur métier : email déjà associé à un compte (HTTP 409 — TSPEC.07). */
export class EmailAlreadyUsedException extends ConflictException {
  constructor(email: string) {
    super(`Un compte existe déjà pour l'email « ${email} ».`);
  }
}

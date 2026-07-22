import { ConflictException } from '@nestjs/common';

/** Adresse déjà associée à un compte (IAM-002). */
export class EmailNotAvailableException extends ConflictException {
  constructor(email: string) {
    super(`L'adresse ${email} est déjà associée à un compte.`);
  }
}

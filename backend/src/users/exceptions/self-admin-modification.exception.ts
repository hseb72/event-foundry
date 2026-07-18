import { ConflictException } from '@nestjs/common';

/**
 * Empêche un administrateur de se verrouiller lui-même : ni retrait de son propre rôle
 * ADMIN, ni désactivation de son propre compte (métier → 409, TSPEC.07).
 */
export class SelfAdminModificationException extends ConflictException {
  constructor(reason: string) {
    super(`Action interdite sur votre propre compte : ${reason}.`);
  }
}

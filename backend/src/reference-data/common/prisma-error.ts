import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Traduit une violation de contrainte d'unicité Prisma (P2002) en conflit métier (409).
 * Toute autre erreur est propagée telle quelle.
 */
export function rethrowAsConflict(error: unknown, message: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ConflictException(message);
  }
  throw error;
}

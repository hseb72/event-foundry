import type { Prisma, Role, User, UserRole } from '@prisma/client';

export type { Role, User, UserRole };

/**
 * Entité User avec ses rôles chargés. Confinée à la couche Repository (TSPEC.01) :
 * jamais exposée telle quelle par l'API (passage obligatoire par un DTO via un Mapper).
 */
export type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

import type { Prisma } from '@prisma/client';

/**
 * Graphe d'identité complet d'un utilisateur : rôles plateforme + permissions, appartenances aux
 * organisations avec leurs rôles/permissions et leur offre. Confiné à la couche Repository
 * (TSPEC.01) : jamais exposé tel quel par l'API. Sert au calcul de l'identité effective.
 */
export const identityInclude = {
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
  memberships: {
    include: {
      organization: { include: { subscriptionPlan: true } },
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
    },
  },
} satisfies Prisma.UserInclude;

export type IdentityGraph = Prisma.UserGetPayload<{ include: typeof identityInclude }>;

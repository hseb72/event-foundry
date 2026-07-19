import { Experience } from '@prisma/client';
import type { IdentityGraph } from '../entities/identity-graph.entity';
import type { EffectiveIdentity } from '../interfaces/effective-identity';

/** Ordre de préférence lorsqu'aucune expérience active n'est encore choisie. */
const EXPERIENCE_PRIORITY: Experience[] = [Experience.EXPLORER, Experience.ORGANIZER, Experience.OPERATOR];

/** Expériences débloquées par l'ensemble des rôles (plateforme + toutes organisations). */
export function availableExperiences(graph: IdentityGraph): Experience[] {
  const set = new Set<Experience>();
  for (const assignment of graph.roles) {
    if (assignment.role.experience) set.add(assignment.role.experience);
  }
  for (const membership of graph.memberships) {
    for (const membershipRole of membership.roles) {
      if (membershipRole.role.experience) set.add(membershipRole.role.experience);
    }
  }
  return EXPERIENCE_PRIORITY.filter((experience) => set.has(experience));
}

/** Expérience active effective : celle choisie si disponible, sinon la première par priorité. */
export function resolveActiveExperience(graph: IdentityGraph): Experience | null {
  const available = availableExperiences(graph);
  if (graph.activeExperience && available.includes(graph.activeExperience)) {
    return graph.activeExperience;
  }
  return available[0] ?? null;
}

/**
 * Calcule l'identité effective (ADR.08/ADR.11). Permissions = union des permissions des rôles
 * plateforme et des rôles de l'organisation ACTIVE uniquement ; l'expérience ne joue aucun rôle
 * dans les permissions. Les collections sont triées pour un JWT et des tests déterministes.
 */
export function computeEffectiveIdentity(graph: IdentityGraph): EffectiveIdentity {
  const roleNames = new Set<string>();
  const permissions = new Set<string>();

  for (const assignment of graph.roles) {
    roleNames.add(assignment.role.name);
    for (const grant of assignment.role.permissions) permissions.add(grant.permission.key);
  }

  const activeMembership =
    graph.activeOrganizationId != null
      ? (graph.memberships.find((m) => m.organizationId === graph.activeOrganizationId) ?? null)
      : null;

  if (activeMembership) {
    for (const membershipRole of activeMembership.roles) {
      roleNames.add(membershipRole.role.name);
      for (const grant of membershipRole.role.permissions) permissions.add(grant.permission.key);
    }
  }

  return {
    userId: graph.id,
    email: graph.email,
    displayName: graph.displayName,
    roles: [...roleNames].sort(),
    permissions: [...permissions].sort(),
    experiences: availableExperiences(graph),
    activeExperience: resolveActiveExperience(graph),
    activeOrganizationId: graph.activeOrganizationId,
    subscription: activeMembership?.organization.subscriptionPlan?.key ?? null,
  };
}

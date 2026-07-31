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
 * Organisation active effective : celle persistée si l'utilisateur en est toujours membre ; sinon,
 * dès qu'il appartient à au moins une organisation, la première (ordre déterministe par nom) est
 * sélectionnée **par défaut**. Ainsi une organisation nouvellement créée ou rejointe est active dès
 * la connexion suivante, sans action explicite. `null` seulement si l'utilisateur n'a aucune
 * appartenance.
 */
export function resolveActiveOrganizationId(graph: IdentityGraph): string | null {
  const memberships = graph.memberships;
  if (
    graph.activeOrganizationId != null &&
    memberships.some((m) => m.organizationId === graph.activeOrganizationId)
  ) {
    return graph.activeOrganizationId;
  }
  const first = [...memberships].sort((a, b) =>
    a.organization.name.localeCompare(b.organization.name) || a.organizationId.localeCompare(b.organizationId),
  )[0];
  return first?.organizationId ?? null;
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

  // L'organisation active est résolue (défaut = première appartenance) pour que les rôles de
  // l'organisation créée/rejointe s'appliquent dès la connexion, sans sélection manuelle préalable.
  const activeOrganizationId = resolveActiveOrganizationId(graph);
  const activeMembership =
    activeOrganizationId != null
      ? (graph.memberships.find((m) => m.organizationId === activeOrganizationId) ?? null)
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
    activeOrganizationId,
    subscription: activeMembership?.organization.subscriptionPlan?.key ?? null,
  };
}

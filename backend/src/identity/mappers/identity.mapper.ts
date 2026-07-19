import type { IdentityGraph } from '../entities/identity-graph.entity';
import { IdentityMeDto, IdentityOrganizationDto } from '../dto/identity-me.dto';
import type { EffectiveIdentity } from '../interfaces/effective-identity';

/** Conversion identité effective + graphe → DTO `me` (les Entities ne sont jamais exposées). */
export function toIdentityMeDto(identity: EffectiveIdentity, graph: IdentityGraph): IdentityMeDto {
  const organizations: IdentityOrganizationDto[] = graph.memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    slug: membership.organization.slug,
    roles: membership.roles.map((membershipRole) => membershipRole.role.name).sort(),
    subscription: membership.organization.subscriptionPlan?.key ?? null,
  }));

  return {
    userId: identity.userId,
    email: identity.email,
    displayName: identity.displayName,
    roles: identity.roles,
    permissions: identity.permissions,
    experiences: identity.experiences,
    activeExperience: identity.activeExperience,
    activeOrganizationId: identity.activeOrganizationId,
    subscription: identity.subscription,
    organizations,
  };
}

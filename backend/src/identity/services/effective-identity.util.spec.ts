import { Experience } from '@prisma/client';
import type { IdentityGraph } from '../entities/identity-graph.entity';
import { availableExperiences, computeEffectiveIdentity } from './effective-identity.util';

function role(name: string, experience: Experience | null, permissionKeys: string[]) {
  return {
    role: {
      name,
      experience,
      permissions: permissionKeys.map((key) => ({ permission: { key } })),
    },
  };
}

interface GraphOptions {
  platformRoles?: ReturnType<typeof role>[];
  activeOrganizationId?: string | null;
  activeExperience?: Experience | null;
  memberships?: Array<{
    organizationId: string;
    plan: string | null;
    roles: ReturnType<typeof role>[];
  }>;
}

function graph(options: GraphOptions = {}): IdentityGraph {
  return {
    id: 'user-1',
    email: 'u@example.com',
    displayName: 'U',
    activeExperience: options.activeExperience ?? null,
    activeOrganizationId: options.activeOrganizationId ?? null,
    roles: options.platformRoles ?? [],
    memberships: (options.memberships ?? []).map((m) => ({
      organizationId: m.organizationId,
      organization: { id: m.organizationId, name: m.organizationId, slug: m.organizationId, subscriptionPlan: m.plan ? { key: m.plan } : null },
      roles: m.roles,
    })),
  } as unknown as IdentityGraph;
}

const EXPLORER = role('Explorer', Experience.EXPLORER, ['catalog.read', 'planning.manage']);
const OPERATOR = role('Platform Operator', Experience.OPERATOR, ['pipeline.manage', 'catalog.read']);
const ORGANIZER = role('Organizer', Experience.ORGANIZER, ['event.publish', 'event.create']);

describe('computeEffectiveIdentity', () => {
  it('un utilisateur plateforme n’a que les permissions de ses rôles plateforme', () => {
    const result = computeEffectiveIdentity(graph({ platformRoles: [EXPLORER] }));
    expect(result.roles).toEqual(['Explorer']);
    expect(result.permissions).toEqual(['catalog.read', 'planning.manage']);
    expect(result.experiences).toEqual([Experience.EXPLORER]);
    expect(result.activeExperience).toBe(Experience.EXPLORER);
    expect(result.subscription).toBeNull();
  });

  it('ajoute les permissions de l’organisation ACTIVE et son offre', () => {
    const result = computeEffectiveIdentity(
      graph({
        platformRoles: [EXPLORER, OPERATOR],
        activeExperience: Experience.ORGANIZER,
        activeOrganizationId: 'org-1',
        memberships: [{ organizationId: 'org-1', plan: 'PRO', roles: [ORGANIZER] }],
      }),
    );
    expect(result.permissions).toContain('event.publish');
    expect(result.roles).toContain('Organizer');
    expect(result.subscription).toBe('PRO');
    // Toutes les expériences des rôles sont disponibles (tri par priorité).
    expect(result.experiences).toEqual([Experience.EXPLORER, Experience.ORGANIZER, Experience.OPERATOR]);
  });

  it('sans organisation active, les permissions d’organisation ne s’appliquent pas', () => {
    const result = computeEffectiveIdentity(
      graph({
        platformRoles: [EXPLORER],
        activeOrganizationId: null,
        memberships: [{ organizationId: 'org-1', plan: 'PRO', roles: [ORGANIZER] }],
      }),
    );
    expect(result.permissions).not.toContain('event.publish');
    expect(result.subscription).toBeNull();
    // ORGANIZER reste une expérience DISPONIBLE (déduite des rôles), même hors contexte org.
    expect(availableExperiences(graph({ platformRoles: [EXPLORER], memberships: [{ organizationId: 'org-1', plan: null, roles: [ORGANIZER] }] }))).toContain(
      Experience.ORGANIZER,
    );
  });

  it('retombe sur une expérience disponible si l’expérience stockée ne l’est pas', () => {
    const result = computeEffectiveIdentity(
      graph({ platformRoles: [EXPLORER], activeExperience: Experience.OPERATOR }),
    );
    expect(result.activeExperience).toBe(Experience.EXPLORER);
  });
});

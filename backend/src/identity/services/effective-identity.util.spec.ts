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

  it('sélectionne l’organisation par défaut dès qu’il existe une appartenance (aucune active stockée)', () => {
    const result = computeEffectiveIdentity(
      graph({
        platformRoles: [EXPLORER],
        activeOrganizationId: null,
        memberships: [{ organizationId: 'org-1', plan: 'PRO', roles: [ORGANIZER] }],
      }),
    );
    // Nouvelle règle (entonnoir Organizer) : l'unique organisation devient active par défaut.
    expect(result.activeOrganizationId).toBe('org-1');
    expect(result.permissions).toContain('event.publish');
    expect(result.subscription).toBe('PRO');
  });

  it('sans aucune appartenance, aucune organisation n’est active et les droits d’org ne s’appliquent pas', () => {
    const result = computeEffectiveIdentity(graph({ platformRoles: [EXPLORER] }));
    expect(result.activeOrganizationId).toBeNull();
    expect(result.permissions).not.toContain('event.publish');
    expect(result.subscription).toBeNull();
  });

  it('choisit la première organisation par ordre de nom quand plusieurs appartenances existent', () => {
    const result = computeEffectiveIdentity(
      graph({
        platformRoles: [EXPLORER],
        activeOrganizationId: null,
        memberships: [
          { organizationId: 'zeta', plan: null, roles: [ORGANIZER] },
          { organizationId: 'alpha', plan: 'PRO', roles: [ORGANIZER] },
        ],
      }),
    );
    // Ordre déterministe : « alpha » avant « zeta » (le nom de l'org = son id dans ce harnais de test).
    expect(result.activeOrganizationId).toBe('alpha');
    expect(result.subscription).toBe('PRO');
  });

  it('retombe sur une appartenance valide si l’organisation active stockée n’en est plus une', () => {
    const result = computeEffectiveIdentity(
      graph({
        platformRoles: [EXPLORER],
        activeOrganizationId: 'org-supprimee',
        memberships: [{ organizationId: 'org-1', plan: null, roles: [ORGANIZER] }],
      }),
    );
    expect(result.activeOrganizationId).toBe('org-1');
  });

  it('ORGANIZER reste une expérience disponible même sans organisation active', () => {
    expect(
      availableExperiences(
        graph({ platformRoles: [EXPLORER], memberships: [{ organizationId: 'org-1', plan: null, roles: [ORGANIZER] }] }),
      ),
    ).toContain(Experience.ORGANIZER);
  });

  it('retombe sur une expérience disponible si l’expérience stockée ne l’est pas', () => {
    const result = computeEffectiveIdentity(
      graph({ platformRoles: [EXPLORER], activeExperience: Experience.OPERATOR }),
    );
    expect(result.activeExperience).toBe(Experience.EXPLORER);
  });
});

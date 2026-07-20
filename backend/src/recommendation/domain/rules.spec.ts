import type { EventWithRefs } from '../../events/entities/event.entity';
import type { RecommendationContext } from './recommendation-rule';
import {
  ActivityAffinityRule,
  CategoryAffinityRule,
  FreeSlotRule,
  NoveltyRule,
  ProximityRule,
  RecencyRule,
} from './rules';

const NOW = new Date('2026-07-20T12:00:00.000Z');

function event(overrides: Partial<EventWithRefs> = {}): EventWithRefs {
  return {
    id: 'e1',
    activityId: 'act-magic',
    categoryId: 'cat-compet',
    municipalityId: 'mun-toulouse',
    startsAt: new Date('2026-08-01T10:00:00.000Z'),
    endsAt: new Date('2026-08-01T12:00:00.000Z'),
    publishedAt: new Date('2026-07-18T10:00:00.000Z'),
    activity: { name: 'Magic' },
    ...overrides,
  } as unknown as EventWithRefs;
}

function context(overrides: Partial<RecommendationContext> = {}): RecommendationContext {
  return {
    surprise: false,
    activityIds: new Set(),
    categoryIds: new Set(),
    municipalityIds: new Set(),
    plannedSlots: [],
    now: NOW,
    ...overrides,
  };
}

describe('Règles de recommandation (déterministes, explicables — ADR.09)', () => {
  it('ActivityAffinity : bonus fort et explication quand l\'activité est fréquentée', () => {
    const contribution = new ActivityAffinityRule().evaluate(
      event(),
      context({ activityIds: new Set(['act-magic']) }),
    );
    expect(contribution).toEqual({ points: 40, reason: expect.stringContaining('Magic') });
  });

  it('ActivityAffinity : poids réduit en mode Surprends-moi', () => {
    const contribution = new ActivityAffinityRule().evaluate(
      event(),
      context({ surprise: true, activityIds: new Set(['act-magic']) }),
    );
    expect(contribution?.points).toBe(10);
  });

  it('Novelty : découverte discrète en mode normal, forte en mode Surprends-moi', () => {
    const normal = new NoveltyRule().evaluate(event(), context());
    const surprise = new NoveltyRule().evaluate(event(), context({ surprise: true }));
    expect(normal?.points).toBe(5);
    expect(surprise?.points).toBe(35);
  });

  it('Novelty : ne s\'applique pas si l\'activité est déjà fréquentée', () => {
    expect(new NoveltyRule().evaluate(event(), context({ activityIds: new Set(['act-magic']) }))).toBeNull();
  });

  it('CategoryAffinity et Proximity : bonus si catégorie / commune fréquentées', () => {
    expect(new CategoryAffinityRule().evaluate(event(), context({ categoryIds: new Set(['cat-compet']) }))?.points).toBe(25);
    expect(new ProximityRule().evaluate(event(), context({ municipalityIds: new Set(['mun-toulouse']) }))?.points).toBe(20);
  });

  it('FreeSlot : bonus si créneau libre, malus si conflit, nul sans planning', () => {
    const rule = new FreeSlotRule();
    expect(rule.evaluate(event(), context())).toBeNull();
    const free = rule.evaluate(
      event(),
      context({ plannedSlots: [{ id: 'p', startsAt: new Date('2026-09-01T10:00:00.000Z'), endsAt: null }] }),
    );
    expect(free?.points).toBe(15);
    const conflict = rule.evaluate(
      event(),
      context({ plannedSlots: [{ id: 'p', startsAt: new Date('2026-08-01T11:00:00.000Z'), endsAt: new Date('2026-08-01T13:00:00.000Z') }] }),
    );
    expect(conflict?.points).toBe(-15);
  });

  it('Recency : bonus uniquement dans la fenêtre de récence', () => {
    const rule = new RecencyRule();
    expect(rule.evaluate(event(), context())?.points).toBe(10);
    expect(rule.evaluate(event({ publishedAt: new Date('2026-01-01T10:00:00.000Z') }), context())).toBeNull();
    expect(rule.evaluate(event({ publishedAt: null }), context())).toBeNull();
  });

  it('est reproductible : mêmes entrées → mêmes contributions', () => {
    const rule = new ActivityAffinityRule();
    const ctx = context({ activityIds: new Set(['act-magic']) });
    expect(rule.evaluate(event(), ctx)).toEqual(rule.evaluate(event(), ctx));
  });
});

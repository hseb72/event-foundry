import type { EventWithRefs } from '../../events/entities/event.entity';
import { slotsOverlap, type PlanningSlot } from '../../planning/services/conflict-detector';

/** Contribution d'une règle au score d'un événement candidat : des points + une justification. */
export interface RuleContribution {
  points: number;
  reason: string;
}

/**
 * Contexte déterministe d'un utilisateur, dérivé de ses signaux explicites (participations,
 * planning). Aucune inférence probabiliste : seules les données observées sont utilisées (ADR.09).
 */
export interface RecommendationContext {
  /** Mode « Surprends-moi » : réduit le poids des habitudes, favorise la nouveauté (FSPEC.09). */
  surprise: boolean;
  /** Activités auxquelles l'utilisateur participe déjà (habitudes). */
  activityIds: ReadonlySet<string>;
  /** Sujets fréquentées. */
  subjectIds: ReadonlySet<string>;
  /** Communes fréquentées. */
  municipalityIds: ReadonlySet<string>;
  /** Suivis explicites de l'utilisateur (Follow — ADR.19), signal d'intérêt fort. */
  followedOrganizerIds: ReadonlySet<string>;
  followedActivityIds: ReadonlySet<string>;
  followedSubjectIds: ReadonlySet<string>;
  followedVenueIds: ReadonlySet<string>;
  /** Créneaux déjà planifiés (participations), pour détecter conflits et créneaux libres. */
  plannedSlots: PlanningSlot[];
  now: Date;
}

/**
 * Règle métier déterministe du moteur de recommandation (ADR.06/ADR.09). Chaque règle est
 * indépendante, testable et explicable : elle calcule sa propre contribution (positive ou négative)
 * et sa justification, sans connaître les autres règles. Retourne `null` si elle ne s'applique pas.
 */
export interface RecommendationRule {
  readonly name: string;
  evaluate(event: EventWithRefs, context: RecommendationContext): RuleContribution | null;
}

/** Vrai si l'événement chevauche au moins un créneau déjà planifié par l'utilisateur. */
export function conflictsWithPlanning(event: EventWithRefs, context: RecommendationContext): boolean {
  const slot: PlanningSlot = { id: event.id, startsAt: event.startsAt, endsAt: event.endsAt };
  return context.plannedSlots.some((planned) => slotsOverlap(slot, planned));
}

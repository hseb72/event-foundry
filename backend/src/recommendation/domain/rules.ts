import type { EventWithRefs } from '../../events/entities/event.entity';
import {
  conflictsWithPlanning,
  type RecommendationContext,
  type RecommendationRule,
  type RuleContribution,
} from './recommendation-rule';

const RECENCY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** Affinité d'activité : l'événement relève d'une activité que l'utilisateur fréquente déjà. */
export class ActivityAffinityRule implements RecommendationRule {
  readonly name = 'activity-affinity';

  evaluate(event: EventWithRefs, context: RecommendationContext): RuleContribution | null {
    if (!context.activityIds.has(event.activityId)) {
      return null;
    }
    // En mode « Surprends-moi », le poids des habitudes est fortement réduit.
    return { points: context.surprise ? 10 : 40, reason: `Activité que vous fréquentez : ${event.activity.name}` };
  }
}

/** Affinité de catégorie : la catégorie fait partie de celles qui intéressent l'utilisateur. */
export class CategoryAffinityRule implements RecommendationRule {
  readonly name = 'category-affinity';

  evaluate(event: EventWithRefs, context: RecommendationContext): RuleContribution | null {
    if (!event.categoryId || !context.categoryIds.has(event.categoryId)) {
      return null;
    }
    return { points: context.surprise ? 5 : 25, reason: 'Catégorie qui vous intéresse' };
  }
}

/** Proximité : l'événement se tient dans une commune où l'utilisateur sort habituellement. */
export class ProximityRule implements RecommendationRule {
  readonly name = 'proximity';

  evaluate(event: EventWithRefs, context: RecommendationContext): RuleContribution | null {
    if (!event.municipalityId || !context.municipalityIds.has(event.municipalityId)) {
      return null;
    }
    return { points: context.surprise ? 10 : 20, reason: 'Près de vos sorties habituelles' };
  }
}

/** Découverte : l'activité sort des habitudes → poids fort en mode « Surprends-moi ». */
export class NoveltyRule implements RecommendationRule {
  readonly name = 'novelty';

  evaluate(event: EventWithRefs, context: RecommendationContext): RuleContribution | null {
    if (context.activityIds.has(event.activityId)) {
      return null;
    }
    return context.surprise
      ? { points: 35, reason: `Nouvelle activité à explorer : ${event.activity.name}` }
      : { points: 5, reason: 'À découvrir' };
  }
}

/** Complète le planning : bonus si le créneau est libre, malus s'il chevauche un événement prévu. */
export class FreeSlotRule implements RecommendationRule {
  readonly name = 'free-slot';

  evaluate(event: EventWithRefs, context: RecommendationContext): RuleContribution | null {
    // Sans planning, la notion de créneau libre n'a pas de sens.
    if (context.plannedSlots.length === 0) {
      return null;
    }
    return conflictsWithPlanning(event, context)
      ? { points: -15, reason: 'Chevauche un événement déjà prévu' }
      : { points: 15, reason: 'Complète votre planning (créneau libre)' };
  }
}

/** Récence : l'événement a été publié récemment (nouveauté du catalogue). */
export class RecencyRule implements RecommendationRule {
  readonly name = 'recency';

  evaluate(event: EventWithRefs, context: RecommendationContext): RuleContribution | null {
    if (!event.publishedAt) {
      return null;
    }
    const age = context.now.getTime() - event.publishedAt.getTime();
    if (age < 0 || age > RECENCY_WINDOW_MS) {
      return null;
    }
    return { points: 10, reason: 'Publié récemment' };
  }
}

/**
 * Chaîne de règles par défaut du moteur (ordre = ordre d'évaluation ; sans incidence sur le score,
 * additif et commutatif). Chaque règle est activable / réordonnable sans modifier le moteur (ADR.06).
 */
export function defaultRecommendationRules(): RecommendationRule[] {
  return [
    new ActivityAffinityRule(),
    new CategoryAffinityRule(),
    new ProximityRule(),
    new NoveltyRule(),
    new FreeSlotRule(),
    new RecencyRule(),
  ];
}

import { Injectable } from '@nestjs/common';
import { RecommendationAction } from '@prisma/client';
import type { EventWithRefs } from '../../events/entities/event.entity';
import { EventNotFoundException } from '../../events/exceptions/event-validation.exceptions';
import { EventMapper } from '../../events/mappers/event.mapper';
import type { RecommendationContext, RecommendationRule } from '../domain/recommendation-rule';
import { defaultRecommendationRules } from '../domain/rules';
import { RecommendationDto } from '../dto/recommendation-response.dto';
import { RecommendationRepository } from '../repositories/recommendation.repository';

/**
 * Moteur de recommandation déterministe (ADR.09 / TSPEC.02). Pour un utilisateur, applique une
 * chaîne de règles métier indépendantes à chaque événement candidat du Catalog, additionne les
 * contributions en un score, classe et explique. Reproductible : un même contexte produit toujours
 * les mêmes recommandations. Aucune IA, aucun apprentissage automatique.
 */
@Injectable()
export class RecommendationService {
  private readonly rules: RecommendationRule[] = defaultRecommendationRules();

  constructor(private readonly repository: RecommendationRepository) {}

  async recommend(
    userId: string,
    options: { surprise: boolean; take: number },
  ): Promise<RecommendationDto[]> {
    const now = new Date();
    const signals = await this.repository.loadSignals(userId);
    const candidates = await this.repository.loadCandidates(userId, now);

    const context: RecommendationContext = {
      surprise: options.surprise,
      activityIds: signals.activityIds,
      categoryIds: signals.categoryIds,
      municipalityIds: signals.municipalityIds,
      plannedSlots: signals.plannedSlots,
      now,
    };

    return candidates
      .map((event) => this.score(event, context))
      .filter((scored) => scored.score > 0)
      // Classement déterministe : score décroissant, puis date, puis identifiant (départage stable).
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.event.startsAt.getTime() - b.event.startsAt.getTime() ||
          a.event.id.localeCompare(b.event.id),
      )
      .slice(0, options.take)
      .map((scored) => ({
        event: EventMapper.toResponse(scored.event),
        score: scored.score,
        reasons: scored.reasons,
      }));
  }

  /** Enregistre la décision de l'utilisateur (accepter / ignorer / refuser). */
  async feedback(userId: string, eventId: string, action: RecommendationAction): Promise<void> {
    if (!(await this.repository.publishedEventExists(eventId))) {
      throw new EventNotFoundException(eventId);
    }
    await this.repository.saveFeedback(userId, eventId, action);
  }

  /** Applique toutes les règles à un événement et agrège score + justifications (ordre des règles). */
  private score(
    event: EventWithRefs,
    context: RecommendationContext,
  ): { event: EventWithRefs; score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    for (const rule of this.rules) {
      const contribution = rule.evaluate(event, context);
      if (contribution) {
        score += contribution.points;
        reasons.push(contribution.reason);
      }
    }
    return { event, score, reasons };
  }
}

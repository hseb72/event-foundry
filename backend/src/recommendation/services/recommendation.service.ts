import { Injectable } from '@nestjs/common';
import { FollowTargetType, RecommendationAction } from '@prisma/client';
import type { EventWithRefs } from '../../events/entities/event.entity';
import { EventNotFoundException } from '../../events/exceptions/event-validation.exceptions';
import { EventMapper } from '../../events/mappers/event.mapper';
import { FollowService } from '../../follow/follow.service';
import type { RecommendationContext, RecommendationRule } from '../domain/recommendation-rule';
import { defaultRecommendationRules } from '../domain/rules';
import { RecommendationDto } from '../dto/recommendation-response.dto';
import { RecommendationRepository } from '../repositories/recommendation.repository';
import { EventCoverService } from '../../event-covers/services/event-cover.service';

/**
 * Moteur de recommandation déterministe (ADR.09 / TSPEC.02). Pour un utilisateur, applique une
 * chaîne de règles métier indépendantes à chaque événement candidat du Catalog, additionne les
 * contributions en un score, classe et explique. Reproductible : un même contexte produit toujours
 * les mêmes recommandations. Aucune IA, aucun apprentissage automatique.
 */
@Injectable()
export class RecommendationService {
  private readonly rules: RecommendationRule[] = defaultRecommendationRules();

  constructor(
    private readonly repository: RecommendationRepository,
    private readonly follows: FollowService,
    private readonly covers: EventCoverService,
  ) {}

  async recommend(
    userId: string,
    options: { surprise: boolean; take: number },
  ): Promise<RecommendationDto[]> {
    const now = new Date();
    const signals = await this.repository.loadSignals(userId);
    const candidates = await this.repository.loadCandidates(userId, now);
    const followed = await this.loadFollowedSets(userId);

    const context: RecommendationContext = {
      surprise: options.surprise,
      activityIds: signals.activityIds,
      subjectIds: signals.subjectIds,
      municipalityIds: signals.municipalityIds,
      followedOrganizerIds: followed.get(FollowTargetType.ORGANIZER) ?? new Set(),
      followedActivityIds: followed.get(FollowTargetType.ACTIVITY) ?? new Set(),
      followedSubjectIds: followed.get(FollowTargetType.SUBJECT) ?? new Set(),
      followedVenueIds: followed.get(FollowTargetType.VENUE) ?? new Set(),
      plannedSlots: signals.plannedSlots,
      now,
    };

    const recommendations = candidates
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
    await this.covers.attach(recommendations.map((reco) => reco.event));
    return recommendations;
  }

  /** Regroupe les suivis actifs de l'utilisateur par type de cible (signaux d'intérêt explicites). */
  private async loadFollowedSets(userId: string): Promise<Map<FollowTargetType, Set<string>>> {
    const follows = await this.follows.listByUser(userId);
    const byType = new Map<FollowTargetType, Set<string>>();
    for (const follow of follows) {
      const set = byType.get(follow.targetType) ?? new Set<string>();
      set.add(follow.targetId);
      byType.set(follow.targetType, set);
    }
    return byType;
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

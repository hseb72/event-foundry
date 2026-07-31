import { Injectable } from '@nestjs/common';
import { EventStatus, RecommendationAction } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EVENT_REFS_INCLUDE, type EventWithRefs } from '../../events/entities/event.entity';
import type { PlanningSlot } from '../../planning/services/conflict-detector';

/** Signaux déterministes d'un utilisateur, dérivés de ses participations (habitudes + planning). */
export interface UserSignals {
  activityIds: Set<string>;
  subjectIds: Set<string>;
  municipalityIds: Set<string>;
  plannedSlots: PlanningSlot[];
}

/**
 * Accès en lecture au Catalog et aux signaux utilisateur pour le moteur de recommandation, et
 * persistance des retours (feedback). Le moteur ne possède jamais les événements : il lit le Catalog
 * et ne stocke que la décision de l'utilisateur (ADR.09 / TSPEC.02). Seul point d'accès PostgreSQL.
 */
@Injectable()
export class RecommendationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Dérive les habitudes et le planning de l'utilisateur à partir de ses participations. */
  async loadSignals(userId: string): Promise<UserSignals> {
    const participations = await this.prisma.userParticipation.findMany({
      where: { userId },
      select: {
        event: {
          select: {
            id: true,
            activityId: true,
            municipalityId: true,
            startsAt: true,
            endsAt: true,
            subjects: { select: { subjectId: true } },
          },
        },
      },
    });
    const signals: UserSignals = {
      activityIds: new Set(),
      subjectIds: new Set(),
      municipalityIds: new Set(),
      plannedSlots: [],
    };
    for (const { event } of participations) {
      signals.activityIds.add(event.activityId);
      for (const link of event.subjects) {
        signals.subjectIds.add(link.subjectId);
      }
      if (event.municipalityId) {
        signals.municipalityIds.add(event.municipalityId);
      }
      signals.plannedSlots.push({ id: event.id, startsAt: event.startsAt, endsAt: event.endsAt });
    }
    return signals;
  }

  /**
   * Événements candidats : publiés, à venir, jamais déjà planifiés par l'utilisateur ni ayant reçu
   * un retour (accepté / ignoré / refusé). Bornés pour un calcul à latence prévisible.
   */
  async loadCandidates(userId: string, now: Date): Promise<EventWithRefs[]> {
    const participated = await this.prisma.userParticipation.findMany({
      where: { userId },
      select: { eventId: true },
    });
    const feedback = await this.prisma.recommendationFeedback.findMany({
      where: { userId },
      select: { eventId: true },
    });
    const excluded = [...new Set([...participated.map((p) => p.eventId), ...feedback.map((f) => f.eventId)])];

    return this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        deletedAt: null,
        startsAt: { gte: now },
        id: { notIn: excluded },
      },
      include: EVENT_REFS_INCLUDE,
      orderBy: { startsAt: 'asc' },
      take: 200,
    });
  }

  /** Enregistre (ou met à jour) le retour de l'utilisateur sur une recommandation. */
  async saveFeedback(userId: string, eventId: string, action: RecommendationAction): Promise<void> {
    await this.prisma.recommendationFeedback.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: { userId, eventId, action },
      update: { action },
    });
  }

  /** Vérifie qu'un événement diffusable (non supprimé) existe, pour valider un retour. */
  async publishedEventExists(eventId: string): Promise<boolean> {
    const count = await this.prisma.event.count({ where: { id: eventId, deletedAt: null } });
    return count > 0;
  }
}

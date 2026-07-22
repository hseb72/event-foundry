import { Inject, Injectable } from '@nestjs/common';
import { EventStatus, type EventStatusEvent } from '@prisma/client';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { DOMAIN_EVENTS, type EventPublishedPayload } from '../../platform/event-bus/domain-event';
import { EVENT_BUS, makeDomainEvent, type EventBus } from '../../platform/event-bus/event-bus';
import { SearchIndexService } from '../../search/services/search-index.service';
import type { EventWithRefs } from '../entities/event.entity';
import {
  EventNotPublishableException,
  InvalidStatusTransitionException,
} from '../exceptions/event-validation.exceptions';
import { EventRepository } from '../repositories/event.repository';
import { EventsService } from './events.service';

/**
 * Transitions autorisées du workflow de publication (EPIC 04) :
 * DRAFT ⇄ SUBMITTED → PUBLISHED ⇄ DRAFT, et ARCHIVED depuis tout état actif (restaurable).
 */
const ALLOWED: Record<EventStatus, EventStatus[]> = {
  DRAFT: [EventStatus.SUBMITTED, EventStatus.PUBLISHED, EventStatus.ARCHIVED],
  SUBMITTED: [EventStatus.PUBLISHED, EventStatus.DRAFT, EventStatus.ARCHIVED],
  PUBLISHED: [EventStatus.DRAFT, EventStatus.ARCHIVED],
  ARCHIVED: [EventStatus.DRAFT],
};

/**
 * Domaine Publishing (TSPEC.05) : pilote le cycle de vie éditorial d'un Event. Chaque transition
 * est validée (transitions autorisées + règles déterministes avant publication) et journalisée
 * (traçabilité). Le catalogue reste propriétaire des données ; Publishing pilote l'état.
 */
@Injectable()
export class PublishingService {
  constructor(
    private readonly events: EventsService,
    private readonly repository: EventRepository,
    private readonly searchIndex: SearchIndexService,
    private readonly notifications: NotificationsService,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  /** Soumet un brouillon à validation (DRAFT → SUBMITTED). */
  submit(id: string, actorId: string): Promise<EventWithRefs> {
    return this.transition(id, EventStatus.SUBMITTED, actorId);
  }

  /** Publie un événement (→ PUBLISHED) après vérification des règles déterministes. */
  publish(id: string, actorId: string): Promise<EventWithRefs> {
    return this.transition(id, EventStatus.PUBLISHED, actorId);
  }

  /** Dépublie / retire de la diffusion (→ DRAFT). */
  unpublish(id: string, actorId: string): Promise<EventWithRefs> {
    return this.transition(id, EventStatus.DRAFT, actorId);
  }

  /** Archive (→ ARCHIVED). */
  archive(id: string, actorId: string): Promise<EventWithRefs> {
    return this.transition(id, EventStatus.ARCHIVED, actorId);
  }

  /** Restaure un événement archivé (ARCHIVED → DRAFT, réintègre le workflow). */
  restore(id: string, actorId: string): Promise<EventWithRefs> {
    return this.transition(id, EventStatus.DRAFT, actorId);
  }

  /** Historique des transitions de statut (audit / traçabilité). */
  async history(id: string): Promise<EventStatusEvent[]> {
    await this.events.getOrThrow(id);
    return this.repository.listStatusEvents(id);
  }

  private async transition(
    id: string,
    to: EventStatus,
    actorId: string,
  ): Promise<EventWithRefs> {
    const event = await this.events.getOrThrow(id);
    const from = event.status;
    if (from === to || !ALLOWED[from].includes(to)) {
      throw new InvalidStatusTransitionException(from, to);
    }
    if (to === EventStatus.PUBLISHED) {
      this.validatePublishable(event);
    }
    // Première publication : publishedAt est encore nul avant cette transition (réécrit ensuite).
    const isFirstPublish = to === EventStatus.PUBLISHED && event.publishedAt == null;
    const updated = await this.repository.applyTransition(id, from, to, actorId);
    await this.syncSearchIndex(updated);
    await this.notifyParticipants(updated, from, actorId);
    // Fait métier « événement publié » (ADR.12 §5). Les abonnés (audit ; Notifications → abonnés
    // Follow) réagissent **sans** coupler la publication : la notification des abonnés n'est plus
    // appelée directement ici, elle est pilotée par le bus (RG-NOTIF-01). Best-effort, non bloquant.
    if (to === EventStatus.PUBLISHED) {
      this.eventBus.publish(
        makeDomainEvent<EventPublishedPayload>(DOMAIN_EVENTS.EVENT_PUBLISHED, {
          eventId: updated.id,
          title: updated.title,
          actorId,
          firstPublish: isFirstPublish,
          organizerId: updated.organizerId,
          activityId: updated.activityId,
          categoryId: updated.categoryId,
          venueId: updated.venueId,
        }),
      );
    }
    return updated;
  }

  /**
   * Émet une notification aux participants lorsqu'une transition affecte un événement de leur
   * planning (dépublication, archivage, remise en ligne). Best-effort : n'altère jamais la transition.
   */
  private async notifyParticipants(
    event: EventWithRefs,
    from: EventStatus,
    actorId: string,
  ): Promise<void> {
    if (event.status === EventStatus.PUBLISHED) {
      await this.notifications.notifyEventChange(event.id, 'EVENT_REPUBLISHED', actorId);
    } else if (event.status === EventStatus.ARCHIVED) {
      await this.notifications.notifyEventChange(event.id, 'EVENT_ARCHIVED', actorId);
    } else if (from === EventStatus.PUBLISHED && event.status === EventStatus.DRAFT) {
      await this.notifications.notifyEventChange(event.id, 'EVENT_UNPUBLISHED', actorId);
    }
  }

  /**
   * Répercute la transition sur l'index de recherche (TSPEC.09) : un événement publié y est
   * (ré)indexé, tout autre état l'en retire. L'indexation n'altère jamais la transition métier.
   */
  private async syncSearchIndex(event: EventWithRefs): Promise<void> {
    if (event.status === EventStatus.PUBLISHED) {
      await this.searchIndex.index(event.id);
    } else {
      await this.searchIndex.remove(event.id);
    }
  }

  /** Règles déterministes de publication (TSPEC.05) : champs obligatoires + cohérence des dates. */
  private validatePublishable(event: EventWithRefs): void {
    if (!event.title?.trim()) {
      throw new EventNotPublishableException('titre manquant');
    }
    if (!event.startsAt) {
      throw new EventNotPublishableException('date de début manquante');
    }
    if (event.endsAt && event.endsAt.getTime() < event.startsAt.getTime()) {
      throw new EventNotPublishableException('la date de fin précède la date de début');
    }
  }
}

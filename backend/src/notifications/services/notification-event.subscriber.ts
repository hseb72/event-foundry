import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DOMAIN_EVENTS, type DomainEvent } from '../../platform/event-bus/domain-event';
import type {
  EventPublishedPayload,
  ImportCompletedPayload,
} from '../../platform/event-bus/domain-event';
import { EVENT_BUS, type EventBus } from '../../platform/event-bus/event-bus';
import { NotificationsService } from './notifications.service';

/**
 * Abonné du bus qui **pilote les notifications à partir des faits métier** (ADR.12 §5 / FSPEC.04
 * RG-NOTIF-01). Les domaines producteurs ne connaissent plus les notifications : ils publient des
 * événements, ce subscriber applique la **politique déterministe** (délègue aux méthodes de
 * `NotificationsService`). Best-effort : le bus isole déjà les erreurs d'abonné.
 *
 * - `import.completed` → famille **technique** : les opérateurs sont prévenus qu'un import est prêt.
 * - `event.published` (première publication) → famille **utilisateur** : les abonnés Follow sont informés.
 */
@Injectable()
export class NotificationEventSubscriber implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS) private readonly bus: EventBus,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit(): void {
    this.bus.subscribe(DOMAIN_EVENTS.IMPORT_COMPLETED, (event) => this.onImportCompleted(event));
    this.bus.subscribe(DOMAIN_EVENTS.EVENT_PUBLISHED, (event) => this.onEventPublished(event));
  }

  private onImportCompleted(event: DomainEvent): Promise<void> {
    const payload = event.payload as ImportCompletedPayload;
    return this.notifications.notifyImportReadyForValidation(payload.importJobId, payload.createdCount);
  }

  private onEventPublished(event: DomainEvent): Promise<void> {
    const payload = event.payload as EventPublishedPayload;
    // Seule la première publication informe les abonnés (pas les re-publications).
    if (!payload.firstPublish) {
      return Promise.resolve();
    }
    return this.notifications.notifyFollowersOfNewEvent(
      {
        id: payload.eventId,
        title: payload.title,
        organizerId: payload.organizerId,
        activityId: payload.activityId,
        categoryId: payload.categoryId,
        venueId: payload.venueId,
      },
      payload.actorId ?? undefined,
    );
  }
}

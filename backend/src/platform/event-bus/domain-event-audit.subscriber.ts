import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ALL_EVENTS, EVENT_BUS, type EventBus } from './event-bus';

/**
 * Premier abonné du bus : **journal d'audit** de tous les événements métier (Principe 7 —
 * traçabilité). Ne prend aucune décision ; il rend visible et auditable le flux d'événements. Les
 * abonnés fonctionnels (notifications…) viendront s'ajouter **sans modifier** les producteurs.
 */
@Injectable()
export class DomainEventAuditSubscriber implements OnModuleInit {
  private readonly logger = new Logger('DomainEvents');

  constructor(@Inject(EVENT_BUS) private readonly bus: EventBus) {}

  onModuleInit(): void {
    this.bus.subscribe(ALL_EVENTS, (event) => {
      this.logger.log(
        `${event.name} correlationId=${event.correlationId} ${JSON.stringify(event.payload)}`,
      );
    });
  }
}

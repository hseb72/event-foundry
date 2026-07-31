import { Global, Module } from '@nestjs/common';
import { DomainEventAuditSubscriber } from './domain-event-audit.subscriber';
import { EVENT_BUS } from './event-bus';
import { InProcessEventBus } from './in-process-event-bus';

/**
 * Fondation « Event Bus » (V3-00, ADR.12 §5). Module **global** : tout domaine injecte `EVENT_BUS`
 * pour publier des faits, sans dépendre d'un autre domaine. Fournit l'implémentation in-process et
 * l'abonné d'audit. Les abonnés fonctionnels (Notifications — domaine 04) s'ajouteront ici ou dans
 * leur propre module en s'abonnant au bus.
 */
@Global()
@Module({
  providers: [
    { provide: EVENT_BUS, useClass: InProcessEventBus },
    DomainEventAuditSubscriber,
  ],
  exports: [EVENT_BUS],
})
export class EventBusModule {}

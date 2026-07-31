import { Injectable, Logger } from '@nestjs/common';
import type { DomainEvent } from './domain-event';
import { ALL_EVENTS, type DomainEventHandler, type EventBus } from './event-bus';

/**
 * Implémentation **in-process** du bus d'événements (ADR.12 §5). Distribution asynchrone et
 * best-effort : chaque abonné est appelé isolément ; son échec est journalisé et **n'affecte ni le
 * producteur ni les autres abonnés** (Principe 6). Gère les abonnements par nom et l'abonnement
 * spécial `*` (audit). Un transport distribué (Redis/BullMQ) pourrait remplacer cette classe sans
 * toucher aux domaines, l'abstraction `EventBus` restant identique.
 */
@Injectable()
export class InProcessEventBus implements EventBus {
  private readonly logger = new Logger('EventBus');
  private readonly handlers = new Map<string, DomainEventHandler[]>();

  subscribe(name: string, handler: DomainEventHandler): void {
    const list = this.handlers.get(name) ?? [];
    list.push(handler);
    this.handlers.set(name, list);
  }

  publish(event: DomainEvent): void {
    // Non bloquant : la publication ne doit jamais retarder ni casser le producteur.
    void this.dispatch(event);
  }

  private async dispatch(event: DomainEvent): Promise<void> {
    const handlers = [
      ...(this.handlers.get(event.name) ?? []),
      ...(this.handlers.get(ALL_EVENTS) ?? []),
    ];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(
          `Abonné en échec pour « ${event.name} » (correlationId=${event.correlationId}) : ${(error as Error).message}`,
        );
      }
    }
  }
}

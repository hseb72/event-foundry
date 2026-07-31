import { Module } from '@nestjs/common';
import { EventCoverRepository } from './repositories/event-cover.repository';
import { EventCoverService } from './services/event-cover.service';

/**
 * Couvertures illustrées des Events pour les vues en liste.
 *
 * Module **volontairement autonome** : il ne dépend que des modules globaux (Prisma, MinIO), ce qui
 * lui permet d'être importé aussi bien par `EventsModule` que par `SearchModule`, `DiscoveryModule`
 * ou `PublicModule` — dont certains sont déjà importés par `EventsModule` — sans créer de cycle.
 */
@Module({
  providers: [EventCoverService, EventCoverRepository],
  exports: [EventCoverService],
})
export class EventCoversModule {}

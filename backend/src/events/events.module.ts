import { Module } from '@nestjs/common';
import { ReferenceDataModule } from '../reference-data/reference-data.module';
import { SearchModule } from '../search/search.module';
import { EventMediaController } from './controllers/event-media.controller';
import { EventsController } from './controllers/events.controller';
import { EventMediaRepository } from './repositories/event-media.repository';
import { EventRepository } from './repositories/event.repository';
import { EventMediaService } from './services/event-media.service';
import { EventsService } from './services/events.service';
import { PublishingService } from './services/publishing.service';

/**
 * Gestion des Events (FSPEC.03 / TSPEC.01). La création valide la hiérarchie référentielle ;
 * le Domain est déduit de l'Activity. Les médias vivent dans MinIO. Exposé aux autres modules
 * via EventsService.
 */
@Module({
  imports: [ReferenceDataModule, SearchModule],
  controllers: [EventsController, EventMediaController],
  providers: [
    EventsService,
    EventRepository,
    EventMediaService,
    EventMediaRepository,
    PublishingService,
  ],
  exports: [EventsService],
})
export class EventsModule {}

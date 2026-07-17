import { Module } from '@nestjs/common';
import { ReferenceDataModule } from '../reference-data/reference-data.module';
import { EventsController } from './controllers/events.controller';
import { EventRepository } from './repositories/event.repository';
import { EventsService } from './services/events.service';

/**
 * Gestion des Events (FSPEC.03). La création valide la hiérarchie référentielle ;
 * le Domain est déduit de l'Activity. Exposé aux autres modules via EventsService.
 */
@Module({
  imports: [ReferenceDataModule],
  controllers: [EventsController],
  providers: [EventsService, EventRepository],
  exports: [EventsService],
})
export class EventsModule {}

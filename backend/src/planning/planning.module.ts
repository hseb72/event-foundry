import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { PlanningController } from './controllers/planning.controller';
import { PlanningService } from './services/planning.service';
import { EventCoversModule } from '../event-covers/event-covers.module';

/**
 * Domaine Planning (TSPEC.03) : planning personnel dérivé des participations, avec détection des
 * conflits d'horaire. Dépend d'EventsModule (calendrier de l'utilisateur) via son service public.
 */
@Module({
  imports: [EventsModule, EventCoversModule],
  controllers: [PlanningController],
  providers: [PlanningService],
})
export class PlanningModule {}

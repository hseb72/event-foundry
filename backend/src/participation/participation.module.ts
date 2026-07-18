import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ParticipationController } from './controllers/participation.controller';
import { UserParticipationRepository } from './repositories/user-participation.repository';
import { ParticipationService } from './services/participation.service';

/**
 * Participation utilisateur (FSPEC.06) : PUT /events/{id}/participation. Trois axes
 * indépendants ; suppression automatique quand tout redevient neutre.
 */
@Module({
  imports: [EventsModule],
  controllers: [ParticipationController],
  providers: [ParticipationService, UserParticipationRepository],
})
export class ParticipationModule {}

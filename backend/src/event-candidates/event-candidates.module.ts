import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { EventsModule } from '../events/events.module';
import { ImportsModule } from '../imports/imports.module';
import { ImportResultConsumer } from './consumers/import-result.consumer';
import { EventCandidatesController } from './controllers/event-candidates.controller';
import { EventCandidateRepository } from './repositories/event-candidate.repository';
import { EventCandidatesService } from './services/event-candidates.service';

/**
 * Validation (FSPEC.02) : consomme RESULT_QUEUE pour créer les EventCandidate, puis expose
 * leur consultation, correction, validation (-> Event) et rejet.
 */
@Module({
  imports: [EventsModule, ImportsModule, CasesModule],
  controllers: [EventCandidatesController],
  providers: [EventCandidatesService, EventCandidateRepository, ImportResultConsumer],
})
export class EventCandidatesModule {}

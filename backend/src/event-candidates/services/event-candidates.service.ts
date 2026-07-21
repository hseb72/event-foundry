import { Injectable } from '@nestjs/common';
import { EventCandidateStatus, EventSource, EventStatus, Prisma } from '@prisma/client';
import { CreateEventDto } from '../../events/dto/create-event.dto';
import type { EventWithRefs } from '../../events/entities/event.entity';
import { EventsService } from '../../events/services/events.service';
import { UpdateEventCandidateDto } from '../dto/update-event-candidate.dto';
import type {
  EventCandidate,
  EventCandidateWithImport,
} from '../entities/event-candidate.entity';
import {
  EventCandidateNotFoundException,
  InvalidCandidateTransitionException,
} from '../exceptions/event-candidate.exceptions';
import { EventCandidateRepository } from '../repositories/event-candidate.repository';

@Injectable()
export class EventCandidatesService {
  constructor(
    private readonly repository: EventCandidateRepository,
    private readonly eventsService: EventsService,
  ) {}

  list(params: {
    status?: EventCandidateStatus;
    importJobId?: string;
    skip: number;
    take: number;
  }): Promise<EventCandidate[]> {
    return this.repository.list(params);
  }

  listByImportJob(importJobId: string): Promise<EventCandidate[]> {
    return this.repository.listByImportJob(importJobId);
  }

  async getDetail(id: string): Promise<EventCandidateWithImport> {
    const candidate = await this.repository.findByIdWithImport(id);
    if (!candidate) {
      throw new EventCandidateNotFoundException(id);
    }
    return candidate;
  }

  async correct(id: string, dto: UpdateEventCandidateDto, userId: string): Promise<EventCandidate> {
    await this.assertMutable(id);
    return this.repository.correct(id, dto.payload as Prisma.InputJsonValue, userId);
  }

  /** Validation : crée l'Event (source = IMPORT) et fige le candidate (transaction). */
  /**
   * Valide un candidate → crée l'Event (source = IMPORT). L'événement entre dans le **workflow de
   * publication** comme une création manuelle : statut **DRAFT** et **rattaché au valideur**
   * (`createdById`), afin qu'il apparaisse dans l'espace Organizer et puisse y être publié.
   */
  async validate(id: string, dto: CreateEventDto, userId: string): Promise<EventWithRefs> {
    await this.assertMutable(id);
    const base = await this.eventsService.buildValidatedEventData(dto, EventSource.IMPORT);
    const eventData: Prisma.EventUncheckedCreateInput = {
      ...base,
      status: EventStatus.DRAFT,
      createdById: userId,
    };
    return this.repository.createEventAndValidate(id, eventData, userId);
  }

  async reject(id: string): Promise<EventCandidate> {
    await this.assertMutable(id);
    return this.repository.reject(id);
  }

  /** Un candidate VALIDATED ou REJECTED n'est plus modifiable (FSPEC.02). */
  private async assertMutable(id: string): Promise<EventCandidate> {
    const candidate = await this.repository.findById(id);
    if (!candidate) {
      throw new EventCandidateNotFoundException(id);
    }
    if (
      candidate.status === EventCandidateStatus.VALIDATED ||
      candidate.status === EventCandidateStatus.REJECTED
    ) {
      throw new InvalidCandidateTransitionException(candidate.status);
    }
    return candidate;
  }
}

import { Injectable } from '@nestjs/common';
import { EventSource, Prisma } from '@prisma/client';
import {
  ActivityNotFoundException,
  OrganizerNotFoundException,
  VenueNotFoundException,
} from '../../reference-data/common/exceptions';
import { ActivityRepository } from '../../reference-data/activities/activity.repository';
import { EventFormatRepository } from '../../reference-data/event-formats/event-format.repository';
import { EventTypeRepository } from '../../reference-data/event-types/event-type.repository';
import { OrganizerRepository } from '../../reference-data/organizers/organizer.repository';
import { VenueRepository } from '../../reference-data/venues/venue.repository';
import { computeDateRange } from '../date-range.util';
import { CreateEventDto } from '../dto/create-event.dto';
import { SearchEventsQueryDto } from '../dto/search-events-query.dto';
import type { EventWithRefs } from '../entities/event.entity';
import {
  EventNotFoundException,
  InvalidEventFormatException,
  InvalidEventTypeException,
} from '../exceptions/event-validation.exceptions';
import { EventRepository } from '../repositories/event.repository';

@Injectable()
export class EventsService {
  constructor(
    private readonly repository: EventRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly eventTypeRepository: EventTypeRepository,
    private readonly eventFormatRepository: EventFormatRepository,
    private readonly organizerRepository: OrganizerRepository,
    private readonly venueRepository: VenueRepository,
  ) {}

  async getOrThrow(id: string): Promise<EventWithRefs> {
    const event = await this.repository.findByIdWithRefs(id);
    if (!event) {
      throw new EventNotFoundException(id);
    }
    return event;
  }

  /** Recherche paginée (FSPEC.04). Filtres cumulables ; par défaut, événements à venir. */
  async search(query: SearchEventsQueryDto): Promise<{
    items: EventWithRefs[];
    total: number;
    skip: number;
    take: number;
  }> {
    const range = computeDateRange({ period: query.period, from: query.from, to: query.to });
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const { items, total } = await this.repository.searchPaginated({
      activityId: query.activityId,
      eventTypeId: query.eventTypeId,
      eventFormatId: query.eventFormatId,
      organizerId: query.organizerId,
      venueId: query.venueId,
      city: query.city,
      text: query.q,
      startsFrom: range.startsFrom,
      startsTo: range.startsTo,
      skip,
      take,
    });

    return { items, total, skip, take };
  }

  /** Création manuelle (source = MANUAL). */
  async createManual(dto: CreateEventDto): Promise<EventWithRefs> {
    const data = await this.buildValidatedEventData(dto, EventSource.MANUAL);
    return this.repository.createWithRefs(data);
  }

  /**
   * Valide la cohérence hiérarchique (FSPEC.03 RM-002..005) et construit les données
   * d'Event sans écrire. Le Domain est déduit de l'Activity côté persistance.
   */
  async buildValidatedEventData(
    dto: CreateEventDto,
    source: EventSource,
  ): Promise<Prisma.EventUncheckedCreateInput> {
    const activity = await this.activityRepository.findById(dto.activityId);
    if (!activity) {
      throw new ActivityNotFoundException(dto.activityId);
    }
    if (dto.eventTypeId) {
      const eventType = await this.eventTypeRepository.findById(dto.eventTypeId);
      if (!eventType || eventType.activityId !== dto.activityId) {
        throw new InvalidEventTypeException(dto.eventTypeId);
      }
    }
    if (dto.eventFormatId) {
      const eventFormat = await this.eventFormatRepository.findById(dto.eventFormatId);
      if (!eventFormat || eventFormat.activityId !== dto.activityId) {
        throw new InvalidEventFormatException(dto.eventFormatId);
      }
    }
    if (dto.organizerId && !(await this.organizerRepository.findById(dto.organizerId))) {
      throw new OrganizerNotFoundException(dto.organizerId);
    }
    if (dto.venueId && !(await this.venueRepository.findById(dto.venueId))) {
      throw new VenueNotFoundException(dto.venueId);
    }

    return {
      source,
      activityId: dto.activityId,
      eventTypeId: dto.eventTypeId ?? null,
      eventFormatId: dto.eventFormatId ?? null,
      organizerId: dto.organizerId ?? null,
      venueId: dto.venueId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt ?? null,
      price: dto.price ?? null,
      currency: dto.currency ?? null,
    };
  }
}

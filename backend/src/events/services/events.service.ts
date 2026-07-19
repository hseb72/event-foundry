import { Injectable } from '@nestjs/common';
import { EventSource, EventStatus, Prisma } from '@prisma/client';
import {
  ActivityNotFoundException,
  CategoryNotFoundException,
  MunicipalityNotFoundException,
  OrganizerNotFoundException,
  VenueNotFoundException,
} from '../../reference-data/common/exceptions';
import { ActivityRepository } from '../../reference-data/activities/activity.repository';
import { CategoryRepository } from '../../reference-data/categories/category.repository';
import { EventFormatRepository } from '../../reference-data/event-formats/event-format.repository';
import { EventTypeRepository } from '../../reference-data/event-types/event-type.repository';
import { MunicipalityRepository } from '../../reference-data/municipalities/municipality.repository';
import { OrganizerRepository } from '../../reference-data/organizers/organizer.repository';
import { TagRepository } from '../../reference-data/tags/tag.repository';
import { VenueRepository } from '../../reference-data/venues/venue.repository';
import { computeDateRange } from '../date-range.util';
import { CalendarQueryDto } from '../dto/calendar-query.dto';
import { CreateEventDto } from '../dto/create-event.dto';
import { SearchEventsQueryDto } from '../dto/search-events-query.dto';
import type { EventWithRefs, EventWithRefsAndParticipation } from '../entities/event.entity';
import {
  EventNotFoundException,
  InvalidEventFormatException,
  InvalidEventTypeException,
  InvalidTagsException,
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
    private readonly categoryRepository: CategoryRepository,
    private readonly municipalityRepository: MunicipalityRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  async getOrThrow(id: string): Promise<EventWithRefs> {
    const event = await this.repository.findByIdWithRefs(id);
    if (!event) {
      throw new EventNotFoundException(id);
    }
    return event;
  }

  /** Recherche paginée (FSPEC.04). Filtres cumulables ; par défaut, événements à venir. */
  async search(
    userId: string,
    query: SearchEventsQueryDto,
  ): Promise<{
    items: EventWithRefsAndParticipation[];
    total: number;
    skip: number;
    take: number;
  }> {
    const range = computeDateRange({ period: query.period, from: query.from, to: query.to });
    const skip = query.skip ?? 0;
    const take = query.take ?? 20;

    const { items, total } = await this.repository.searchPaginated({
      userId,
      activityId: query.activityId,
      eventTypeId: query.eventTypeId,
      eventFormatId: query.eventFormatId,
      organizerId: query.organizerId,
      venueId: query.venueId,
      categoryId: query.categoryId,
      municipalityId: query.municipalityId,
      tagId: query.tagId,
      // Découverte : par défaut, seuls les événements publiés (archivés/brouillons masqués).
      status: query.status ?? EventStatus.PUBLISHED,
      city: query.city,
      text: query.q,
      participationScope: query.participation ?? 'all',
      startsFrom: range.startsFrom,
      startsTo: range.startsTo,
      skip,
      take,
    });

    return { items, total, skip, take };
  }

  /**
   * Calendrier personnel (FSPEC.05) : événements ayant une participation de l'utilisateur.
   * Par défaut, aucune borne temporelle (les événements passés restent consultables).
   */
  getCalendar(userId: string, query: CalendarQueryDto): Promise<EventWithRefsAndParticipation[]> {
    const range =
      query.period || query.from || query.to
        ? computeDateRange({ period: query.period, from: query.from, to: query.to })
        : {};
    return this.repository.listCalendarForUser(userId, range.startsFrom, range.startsTo);
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
    if (dto.categoryId && !(await this.categoryRepository.findById(dto.categoryId))) {
      throw new CategoryNotFoundException(dto.categoryId);
    }
    if (dto.municipalityId && !(await this.municipalityRepository.findById(dto.municipalityId))) {
      throw new MunicipalityNotFoundException(dto.municipalityId);
    }
    const tagIds = await this.validateTags(dto.tagIds);

    return {
      source,
      activityId: dto.activityId,
      eventTypeId: dto.eventTypeId ?? null,
      eventFormatId: dto.eventFormatId ?? null,
      categoryId: dto.categoryId ?? null,
      organizerId: dto.organizerId ?? null,
      venueId: dto.venueId ?? null,
      municipalityId: dto.municipalityId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt ?? null,
      price: dto.price ?? null,
      currency: dto.currency ?? null,
      tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
    };
  }

  /** Archive un Event (retiré du catalogue actif, conservé). */
  async archive(id: string): Promise<EventWithRefs> {
    await this.getOrThrow(id);
    return this.repository.setStatus(id, EventStatus.ARCHIVED);
  }

  /** Restaure un Event archivé (de nouveau publié). */
  async restore(id: string): Promise<EventWithRefs> {
    await this.getOrThrow(id);
    return this.repository.setStatus(id, EventStatus.PUBLISHED);
  }

  /** Vérifie que tous les tags existent ; renvoie la liste dédoublonnée. */
  private async validateTags(tagIds: string[] | undefined): Promise<string[]> {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }
    const unique = [...new Set(tagIds)];
    const existing = await this.tagRepository.findExistingIds(unique);
    const missing = unique.filter((id) => !existing.includes(id));
    if (missing.length > 0) {
      throw new InvalidTagsException(missing);
    }
    return unique;
  }
}

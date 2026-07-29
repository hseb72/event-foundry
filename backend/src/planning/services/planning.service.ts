import { Injectable } from '@nestjs/common';
import { CalendarQueryDto } from '../../events/dto/calendar-query.dto';
import { EventMapper } from '../../events/mappers/event.mapper';
import { EventsService } from '../../events/services/events.service';
import { EventCoverService } from '../../event-covers/services/event-cover.service';
import { PlanningEntryDto } from '../dto/planning-entry.dto';
import { detectConflicts } from './conflict-detector';

/**
 * Domaine Planning (TSPEC.03) : organise la relation entre l'utilisateur et les événements du
 * Catalog. Le planning est dérivé des participations ; le domaine ne possède jamais l'événement.
 * Sa valeur propre en V2 : la détection déterministe des conflits d'horaire.
 */
@Injectable()
export class PlanningService {
  constructor(
    private readonly events: EventsService,
    private readonly covers: EventCoverService,
  ) {}

  async getPlanning(userId: string, query: CalendarQueryDto): Promise<PlanningEntryDto[]> {
    const events = await this.events.getCalendar(userId, query);
    const conflicts = detectConflicts(
      events.map((event) => ({ id: event.id, startsAt: event.startsAt, endsAt: event.endsAt })),
    );
    const entries = events.map((event) => ({
      event: EventMapper.toResponse(event, event.participations[0] ?? null),
      conflictsWith: conflicts.get(event.id) ?? [],
    }));
    await this.covers.attach(entries.map((entry) => entry.event));
    return entries;
  }
}

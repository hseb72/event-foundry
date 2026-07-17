import { EventSource } from '@prisma/client';
import { ActivityRepository } from '../../reference-data/activities/activity.repository';
import { EventFormatRepository } from '../../reference-data/event-formats/event-format.repository';
import { EventTypeRepository } from '../../reference-data/event-types/event-type.repository';
import { OrganizerRepository } from '../../reference-data/organizers/organizer.repository';
import { VenueRepository } from '../../reference-data/venues/venue.repository';
import { CreateEventDto } from '../dto/create-event.dto';
import { InvalidEventTypeException } from '../exceptions/event-validation.exceptions';
import { EventRepository } from '../repositories/event.repository';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let activityRepo: { findById: jest.Mock };
  let eventTypeRepo: { findById: jest.Mock };
  let service: EventsService;

  beforeEach(() => {
    activityRepo = { findById: jest.fn() };
    eventTypeRepo = { findById: jest.fn() };
    const noop = { findById: jest.fn() };
    service = new EventsService(
      { createWithRefs: jest.fn(), findByIdWithRefs: jest.fn() } as unknown as EventRepository,
      activityRepo as unknown as ActivityRepository,
      eventTypeRepo as unknown as EventTypeRepository,
      noop as unknown as EventFormatRepository,
      noop as unknown as OrganizerRepository,
      noop as unknown as VenueRepository,
    );
  });

  const baseDto = {
    activityId: 'a1',
    title: 'Tournoi',
    startsAt: '2024-07-12T00:00:00.000Z',
  } as CreateEventDto;

  it('construit les données quand la hiérarchie est valide', async () => {
    activityRepo.findById.mockResolvedValue({ id: 'a1' });
    const data = await service.buildValidatedEventData(baseDto, EventSource.MANUAL);
    expect(data.activityId).toBe('a1');
    expect(data.source).toBe(EventSource.MANUAL);
  });

  it('rejette une Activity inconnue', async () => {
    activityRepo.findById.mockResolvedValue(null);
    await expect(service.buildValidatedEventData(baseDto, EventSource.MANUAL)).rejects.toThrow();
  });

  it('rejette un EventType appartenant à une autre Activity', async () => {
    activityRepo.findById.mockResolvedValue({ id: 'a1' });
    eventTypeRepo.findById.mockResolvedValue({ id: 't1', activityId: 'autre' });
    await expect(
      service.buildValidatedEventData(
        { ...baseDto, eventTypeId: 't1' } as CreateEventDto,
        EventSource.IMPORT,
      ),
    ).rejects.toBeInstanceOf(InvalidEventTypeException);
  });
});

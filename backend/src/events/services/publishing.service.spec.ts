import { EventStatus } from '@prisma/client';
import type { NotificationsService } from '../../notifications/services/notifications.service';
import type { EventBus } from '../../platform/event-bus/event-bus';
import type { SearchIndexService } from '../../search/services/search-index.service';
import {
  EventNotPublishableException,
  InvalidStatusTransitionException,
} from '../exceptions/event-validation.exceptions';
import type { EventRepository } from '../repositories/event.repository';
import type { EventsService } from './events.service';
import { PublishingService } from './publishing.service';

/**
 * Règles déterministes du cycle éditorial (TSPEC.05), au premier rang desquelles l'invariant
 * ESUB-009 : un événement **privé** n'est jamais publié.
 */
describe('PublishingService', () => {
  let events: { getOrThrow: jest.Mock };
  let repository: { applyTransition: jest.Mock; listStatusEvents: jest.Mock };
  let service: PublishingService;

  const draft = {
    id: 'e1',
    status: EventStatus.DRAFT,
    visibility: 'PUBLIC',
    title: 'Tournoi',
    startsAt: new Date('2026-06-08T14:00:00Z'),
    endsAt: null,
    publishedAt: null,
    organizerId: null,
    activityId: 'a1',
    venueId: null,
    subjects: [],
    modalities: [],
    tags: [],
    participations: [],
  };

  beforeEach(() => {
    events = { getOrThrow: jest.fn() };
    repository = {
      applyTransition: jest.fn().mockResolvedValue({ ...draft, status: EventStatus.PUBLISHED }),
      listStatusEvents: jest.fn(),
    };
    service = new PublishingService(
      events as unknown as EventsService,
      repository as unknown as EventRepository,
      { index: jest.fn(), remove: jest.fn() } as unknown as SearchIndexService,
      { notifyEventChange: jest.fn() } as unknown as NotificationsService,
      { publish: jest.fn(), subscribe: jest.fn() } as unknown as EventBus,
    );
  });

  it('publie un événement public complet', async () => {
    events.getOrThrow.mockResolvedValue(draft);
    await service.publish('e1', 'actor');
    expect(repository.applyTransition).toHaveBeenCalledWith('e1', 'DRAFT', 'PUBLISHED', 'actor');
  });

  it('refuse de publier un événement PRIVÉ (ESUB-009 : jamais diffusé au catalogue)', async () => {
    events.getOrThrow.mockResolvedValue({ ...draft, visibility: 'PRIVATE' });
    await expect(service.publish('e1', 'actor')).rejects.toBeInstanceOf(
      EventNotPublishableException,
    );
    expect(repository.applyTransition).not.toHaveBeenCalled();
  });

  it('refuse une publication sans titre', async () => {
    events.getOrThrow.mockResolvedValue({ ...draft, title: '  ' });
    await expect(service.publish('e1', 'actor')).rejects.toBeInstanceOf(
      EventNotPublishableException,
    );
  });

  it('refuse une transition non autorisée (archivé → publié)', async () => {
    events.getOrThrow.mockResolvedValue({ ...draft, status: EventStatus.ARCHIVED });
    await expect(service.publish('e1', 'actor')).rejects.toBeInstanceOf(
      InvalidStatusTransitionException,
    );
  });
});

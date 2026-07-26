import type { CreateEventDto } from '../../events/dto/create-event.dto';
import { EventsService } from '../../events/services/events.service';
import { InvalidCandidateTransitionException } from '../exceptions/event-candidate.exceptions';
import { EventCandidateRepository } from '../repositories/event-candidate.repository';
import { EventCandidatesService } from './event-candidates.service';

describe('EventCandidatesService', () => {
  let repo: {
    findById: jest.Mock;
    reject: jest.Mock;
    createEventAndValidate: jest.Mock;
  };
  let eventsService: { buildValidatedEventData: jest.Mock };
  let service: EventCandidatesService;

  beforeEach(() => {
    repo = { findById: jest.fn(), reject: jest.fn(), createEventAndValidate: jest.fn() };
    eventsService = { buildValidatedEventData: jest.fn() };
    service = new EventCandidatesService(
      repo as unknown as EventCandidateRepository,
      eventsService as unknown as EventsService,
    );
  });

  it('refuse toute action sur un candidate VALIDATED', async () => {
    repo.findById.mockResolvedValue({ id: 'c1', status: 'VALIDATED' });
    await expect(service.reject('c1')).rejects.toBeInstanceOf(InvalidCandidateTransitionException);
    expect(repo.reject).not.toHaveBeenCalled();
  });

  it('valide un candidate PENDING en créant l\'Event (transaction)', async () => {
    repo.findById.mockResolvedValue({ id: 'c1', status: 'PENDING' });
    eventsService.buildValidatedEventData.mockResolvedValue({
      source: 'IMPORT',
      activityId: 'a1',
      title: 'T',
      startsAt: '2024-07-12T00:00:00.000Z',
    });
    repo.createEventAndValidate.mockResolvedValue({ id: 'e1' });

    const event = await service.validate('c1', { activityId: 'a1' } as CreateEventDto, 'user-1', true);

    expect(event.id).toBe('e1');
    // Valideur Organizer (canPublish) : Event PUBLIC en DRAFT, rattaché au valideur (createdById).
    expect(repo.createEventAndValidate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        source: 'IMPORT',
        status: 'DRAFT',
        visibility: 'PUBLIC',
        createdById: 'user-1',
      }),
      'user-1',
    );
  });

  it('validation Explorer (sans droit de publication) → Event PRIVATE personnel (FSPEC.22 §15)', async () => {
    repo.findById.mockResolvedValue({ id: 'c1', status: 'PENDING' });
    eventsService.buildValidatedEventData.mockResolvedValue({
      source: 'IMPORT',
      activityId: 'a1',
      title: 'T',
      startsAt: '2024-07-12T00:00:00.000Z',
    });
    repo.createEventAndValidate.mockResolvedValue({ id: 'e2' });

    await service.validate('c1', { activityId: 'a1' } as CreateEventDto, 'user-2', false);

    expect(repo.createEventAndValidate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ visibility: 'PRIVATE', createdById: 'user-2' }),
      'user-2',
    );
  });
});

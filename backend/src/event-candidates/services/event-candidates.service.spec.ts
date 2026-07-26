import type { CreateEventDto } from '../../events/dto/create-event.dto';
import { CasesService } from '../../cases/cases.service';
import { EventsService } from '../../events/services/events.service';
import {
  InvalidCandidateTransitionException,
  SubmissionHeldForReviewException,
} from '../exceptions/event-candidate.exceptions';
import { EventCandidateRepository } from '../repositories/event-candidate.repository';
import { EventCandidatesService } from './event-candidates.service';

describe('EventCandidatesService', () => {
  let repo: {
    findById: jest.Mock;
    reject: jest.Mock;
    createEventAndValidate: jest.Mock;
  };
  let eventsService: { buildValidatedEventData: jest.Mock; hasPublicDuplicate: jest.Mock };
  let cases: { open: jest.Mock };
  let service: EventCandidatesService;

  beforeEach(() => {
    repo = { findById: jest.fn(), reject: jest.fn(), createEventAndValidate: jest.fn() };
    eventsService = {
      buildValidatedEventData: jest.fn(),
      hasPublicDuplicate: jest.fn().mockResolvedValue(false),
    };
    cases = { open: jest.fn().mockResolvedValue({ id: 'case-1', reference: 'C-ABCD1234' }) };
    service = new EventCandidatesService(
      repo as unknown as EventCandidateRepository,
      eventsService as unknown as EventsService,
      cases as unknown as CasesService,
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

  describe('contrôles automatiques §13 (FSPEC.22-B)', () => {
    beforeEach(() => {
      repo.findById.mockResolvedValue({ id: 'c1', status: 'PENDING' });
      repo.createEventAndValidate.mockResolvedValue({ id: 'e1' });
    });

    it('dates incohérentes (fin < début) → Case ouverte + validation retenue (422), Event non créé', async () => {
      eventsService.buildValidatedEventData.mockResolvedValue({
        source: 'IMPORT',
        activityId: 'a1',
        title: 'T',
        startsAt: '2024-07-12T18:00:00.000Z',
        endsAt: '2024-07-12T09:00:00.000Z',
      });

      await expect(
        service.validate('c1', { activityId: 'a1' } as CreateEventDto, 'user-1', false),
      ).rejects.toBeInstanceOf(SubmissionHeldForReviewException);

      expect(cases.open).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'DATA_CORRECTION', origin: 'EXPLORER', requesterId: 'user-1' }),
      );
      expect(repo.createEventAndValidate).not.toHaveBeenCalled();
    });

    it('doublon public (chemin publiable) → Case CONTENT_REPORT + validation retenue', async () => {
      eventsService.buildValidatedEventData.mockResolvedValue({
        source: 'IMPORT',
        activityId: 'a1',
        title: 'Tournoi Magic',
        startsAt: '2024-07-12T18:00:00.000Z',
      });
      eventsService.hasPublicDuplicate.mockResolvedValue(true);

      await expect(
        service.validate('c1', { activityId: 'a1' } as CreateEventDto, 'org-1', true),
      ).rejects.toBeInstanceOf(SubmissionHeldForReviewException);

      expect(cases.open).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CONTENT_REPORT', origin: 'ORGANIZER' }),
      );
      expect(repo.createEventAndValidate).not.toHaveBeenCalled();
    });

    it('doublon ignoré pour un événement privé Explorer (copie personnelle légitime)', async () => {
      eventsService.buildValidatedEventData.mockResolvedValue({
        source: 'IMPORT',
        activityId: 'a1',
        title: 'Tournoi Magic',
        startsAt: '2024-07-12T18:00:00.000Z',
      });
      eventsService.hasPublicDuplicate.mockResolvedValue(true);

      await service.validate('c1', { activityId: 'a1' } as CreateEventDto, 'user-1', false);

      // Le contrôle de doublon n'est pas exécuté pour un Explorer : pas de Case, Event privé créé.
      expect(eventsService.hasPublicDuplicate).not.toHaveBeenCalled();
      expect(cases.open).not.toHaveBeenCalled();
      expect(repo.createEventAndValidate).toHaveBeenCalled();
    });
  });
});

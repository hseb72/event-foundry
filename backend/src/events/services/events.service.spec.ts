import { EventSource } from '@prisma/client';
import { ActivityRepository } from '../../reference-data/activities/activity.repository';
import { CategoryRepository } from '../../reference-data/categories/category.repository';
import { EventFormatRepository } from '../../reference-data/event-formats/event-format.repository';
import { EventTypeRepository } from '../../reference-data/event-types/event-type.repository';
import { MunicipalityRepository } from '../../reference-data/municipalities/municipality.repository';
import { OrganizerRepository } from '../../reference-data/organizers/organizer.repository';
import { ModalityRepository } from '../../reference-data/modalities/modality.repository';
import { SubjectRepository } from '../../reference-data/subjects/subject.repository';
import { TagRepository } from '../../reference-data/tags/tag.repository';
import { VenueRepository } from '../../reference-data/venues/venue.repository';
import { CreateEventDto } from '../dto/create-event.dto';
import {
  EventNotFoundException,
  InvalidEventTypeException,
  InvalidTagsException,
} from '../exceptions/event-validation.exceptions';
import { EventRepository } from '../repositories/event.repository';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let activityRepo: { findById: jest.Mock };
  let eventTypeRepo: { findById: jest.Mock };
  let categoryRepo: { findById: jest.Mock };
  let municipalityRepo: { findById: jest.Mock };
  let tagRepo: { findExistingIds: jest.Mock };
  let subjectRepo: { findById: jest.Mock };
  let modalityRepo: { findById: jest.Mock };
  let eventRepo: {
    createWithRefs: jest.Mock;
    findByIdWithRefs: jest.Mock;
    searchPaginated: jest.Mock;
    recordStatusEvent: jest.Mock;
    applyTransition: jest.Mock;
  };
  let service: EventsService;

  beforeEach(() => {
    activityRepo = { findById: jest.fn() };
    eventTypeRepo = { findById: jest.fn() };
    categoryRepo = { findById: jest.fn() };
    municipalityRepo = { findById: jest.fn() };
    tagRepo = { findExistingIds: jest.fn().mockResolvedValue([]) };
    subjectRepo = { findById: jest.fn() };
    modalityRepo = { findById: jest.fn() };
    eventRepo = {
      createWithRefs: jest.fn(),
      findByIdWithRefs: jest.fn(),
      searchPaginated: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      recordStatusEvent: jest.fn(),
      applyTransition: jest.fn(),
    };
    const noop = { findById: jest.fn() };
    service = new EventsService(
      eventRepo as unknown as EventRepository,
      activityRepo as unknown as ActivityRepository,
      eventTypeRepo as unknown as EventTypeRepository,
      noop as unknown as EventFormatRepository,
      noop as unknown as OrganizerRepository,
      noop as unknown as VenueRepository,
      categoryRepo as unknown as CategoryRepository,
      municipalityRepo as unknown as MunicipalityRepository,
      tagRepo as unknown as TagRepository,
      subjectRepo as unknown as SubjectRepository,
      modalityRepo as unknown as ModalityRepository,
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

  describe('getForReader — garde de visibilité (FSPEC.22 §15)', () => {
    it('un événement public est lisible par n’importe qui', async () => {
      eventRepo.findByIdWithRefs.mockResolvedValue({ id: 'e1', visibility: 'PUBLIC', createdById: 'owner' });
      await expect(service.getForReader('e1', 'autre')).resolves.toEqual(
        expect.objectContaining({ id: 'e1' }),
      );
    });

    it('un événement privé n’est lisible que par son créateur', async () => {
      eventRepo.findByIdWithRefs.mockResolvedValue({ id: 'e1', visibility: 'PRIVATE', createdById: 'owner' });
      await expect(service.getForReader('e1', 'owner')).resolves.toEqual(
        expect.objectContaining({ id: 'e1' }),
      );
    });

    it('un tiers ne peut pas lire un événement privé (traité comme inexistant)', async () => {
      eventRepo.findByIdWithRefs.mockResolvedValue({ id: 'e1', visibility: 'PRIVATE', createdById: 'owner' });
      await expect(service.getForReader('e1', 'intrus')).rejects.toBeInstanceOf(EventNotFoundException);
    });
  });

  describe('createPrivateManual — création privée Explorer (FSPEC.22 §15)', () => {
    it('crée un événement PRIVATE personnel, sans organisation', async () => {
      activityRepo.findById.mockResolvedValue({ id: 'a1' });
      eventRepo.createWithRefs.mockResolvedValue({ id: 'e1' });
      await service.createPrivateManual(baseDto, 'owner');
      const data = eventRepo.createWithRefs.mock.calls[0][0];
      expect(data.visibility).toBe('PRIVATE');
      expect(data.createdById).toBe('owner');
      expect(data.organizationId).toBeNull();
      expect(data.status).toBe('DRAFT');
    });
  });

  describe('archivePrivate / restorePrivate — garde de propriété (FSPEC.22 §15)', () => {
    it('archive un événement privé de son créateur', async () => {
      eventRepo.findByIdWithRefs.mockResolvedValue({ id: 'e1', visibility: 'PRIVATE', createdById: 'owner', status: 'DRAFT' });
      eventRepo.applyTransition.mockResolvedValue({ id: 'e1', status: 'ARCHIVED' });
      await service.archivePrivate('e1', 'owner');
      expect(eventRepo.applyTransition).toHaveBeenCalledWith('e1', 'DRAFT', 'ARCHIVED', 'owner');
    });

    it('refuse un tiers (traité comme inexistant)', async () => {
      eventRepo.findByIdWithRefs.mockResolvedValue({ id: 'e1', visibility: 'PRIVATE', createdById: 'owner', status: 'DRAFT' });
      await expect(service.archivePrivate('e1', 'intrus')).rejects.toBeInstanceOf(EventNotFoundException);
      expect(eventRepo.applyTransition).not.toHaveBeenCalled();
    });

    it('refuse d’archiver un événement public via ce chemin privé', async () => {
      eventRepo.findByIdWithRefs.mockResolvedValue({ id: 'e1', visibility: 'PUBLIC', createdById: 'owner', status: 'DRAFT' });
      await expect(service.archivePrivate('e1', 'owner')).rejects.toBeInstanceOf(EventNotFoundException);
    });
  });

  describe('search — périmètre organisation (espace Organizer)', () => {
    it('organizationScope + organisation active → filtre par organisation, tous statuts', async () => {
      await service.search('u1', { organizationScope: true } as never, 'org-9');
      const filter = eventRepo.searchPaginated.mock.calls[0][0];
      expect(filter.organizationId).toBe('org-9');
      expect(filter.autonomousCreatorId).toBeUndefined();
      expect(filter.createdById).toBeUndefined();
      expect(filter.status).toBeUndefined();
    });

    it('organizationScope sans organisation active → mode autonome (mes événements sans organisation)', async () => {
      await service.search('u1', { organizationScope: true } as never, null);
      const filter = eventRepo.searchPaginated.mock.calls[0][0];
      expect(filter.autonomousCreatorId).toBe('u1');
      expect(filter.organizationId).toBeUndefined();
    });
  });

  it('inclut les tags valides et rejette un tag inconnu', async () => {
    activityRepo.findById.mockResolvedValue({ id: 'a1' });
    tagRepo.findExistingIds.mockResolvedValueOnce(['tag-1']);
    const data = await service.buildValidatedEventData(
      { ...baseDto, tagIds: ['tag-1'] } as CreateEventDto,
      EventSource.MANUAL,
    );
    expect(data.tags).toEqual({ create: [{ tagId: 'tag-1' }] });

    tagRepo.findExistingIds.mockResolvedValueOnce([]);
    await expect(
      service.buildValidatedEventData(
        { ...baseDto, tagIds: ['missing'] } as CreateEventDto,
        EventSource.MANUAL,
      ),
    ).rejects.toBeInstanceOf(InvalidTagsException);
  });
});

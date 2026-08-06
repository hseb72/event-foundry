import { BadRequestException } from '@nestjs/common';
import { CaseStatus } from '@prisma/client';
import type { ActivitiesService } from '../reference-data/activities/activities.service';
import type { EventTypesService } from '../reference-data/event-types/event-types.service';
import type { OrganizersService } from '../reference-data/organizers/organizers.service';
import type { SubjectsService } from '../reference-data/subjects/subjects.service';
import type { VenuesService } from '../reference-data/venues/venues.service';
import type { CasesService } from './cases.service';
import { ReferenceSuggestionService } from './reference-suggestion.service';

describe('ReferenceSuggestionService — proposer, puis trancher', () => {
  let cases: {
    open: jest.Mock;
    addComment: jest.Mock;
    mergeMetadata: jest.Mock;
    changeStatus: jest.Mock;
  };
  let activities: { create: jest.Mock };
  let eventTypes: { create: jest.Mock };
  let subjects: { create: jest.Mock };
  let organizers: { create: jest.Mock };
  let venues: { create: jest.Mock };
  let service: ReferenceSuggestionService;

  beforeEach(() => {
    cases = {
      open: jest.fn().mockResolvedValue({ id: 'case-1' }),
      addComment: jest.fn().mockResolvedValue(undefined),
      mergeMetadata: jest.fn().mockResolvedValue(undefined),
      changeStatus: jest.fn().mockResolvedValue({ id: 'case-1', status: CaseStatus.RESOLVED }),
    };
    activities = { create: jest.fn().mockResolvedValue({ id: 'act-1' }) };
    eventTypes = { create: jest.fn().mockResolvedValue({ id: 'type-1' }) };
    subjects = { create: jest.fn().mockResolvedValue({ id: 'sub-1' }) };
    organizers = { create: jest.fn().mockResolvedValue({ id: 'org-1' }) };
    venues = { create: jest.fn().mockResolvedValue({ id: 'venue-1' }) };
    service = new ReferenceSuggestionService(
      cases as unknown as CasesService,
      activities as unknown as ActivitiesService,
      eventTypes as unknown as EventTypesService,
      subjects as unknown as SubjectsService,
      organizers as unknown as OrganizersService,
      venues as unknown as VenuesService,
    );
  });

  describe('ouverture', () => {
    it('ouvre une Case de type REFERENCE_SUGGESTION sans rien créer au référentiel', async () => {
      await service.open({
        suggestion: { kind: 'SUBJECT', label: 'Riftbound', context: 'Tournoi du samedi' },
        requesterId: 'user-1',
        origin: 'EXPLORER',
      });

      expect(cases.open).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'REFERENCE_SUGGESTION',
          subject: 'Ajout au référentiel — Sujet « Riftbound »',
          requesterId: 'user-1',
        }),
      );
      // Proposer n'écrit jamais : c'est ce qui permet de l'ouvrir à tout utilisateur authentifié.
      expect(subjects.create).not.toHaveBeenCalled();
    });

    it('refuse un libellé vide', async () => {
      await expect(
        service.open({
          suggestion: { kind: 'EVENT_TYPE', label: '   ' },
          requesterId: 'user-1',
          origin: 'EXPLORER',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('acceptation', () => {
    it('crée la référence avec le libellé **corrigé** par la modération, puis résout la Case', async () => {
      await service.accept(
        'case-1',
        { kind: 'SUBJECT', name: 'Riftbound', parentId: 'fam-tcg' },
        'operator-1',
      );

      expect(subjects.create).toHaveBeenCalledWith({ name: 'Riftbound', familyId: 'fam-tcg' });
      expect(cases.mergeMetadata).toHaveBeenCalledWith('case-1', { createdReferenceId: 'sub-1' });
      expect(cases.changeStatus).toHaveBeenCalledWith(
        'case-1',
        CaseStatus.RESOLVED,
        'operator-1',
        expect.any(String),
      );
    });

    it('exige un domaine pour une activité', async () => {
      await expect(
        service.accept('case-1', { kind: 'ACTIVITY', name: 'Jeux' }, 'operator-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(activities.create).not.toHaveBeenCalled();
    });

    it('exige une famille pour un sujet', async () => {
      await expect(
        service.accept('case-1', { kind: 'SUBJECT', name: 'Riftbound' }, 'operator-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(subjects.create).not.toHaveBeenCalled();
    });

    it('n’exige aucun parent pour un type, un organisateur ou un lieu', async () => {
      await service.accept('case-1', { kind: 'EVENT_TYPE', name: 'Avant-première' }, 'operator-1');
      expect(eventTypes.create).toHaveBeenCalledWith({ name: 'Avant-première' });
    });

    it('laisse la Case ouverte si le référentiel refuse la création', async () => {
      // Doublon, terme interdit… : la modération doit pouvoir corriger, pas hériter d'une Case
      // résolue sans référence créée.
      subjects.create.mockRejectedValue(new Error('doublon'));

      await expect(
        service.accept('case-1', { kind: 'SUBJECT', name: 'Magic', parentId: 'fam-tcg' }, 'op-1'),
      ).rejects.toThrow('doublon');
      expect(cases.changeStatus).not.toHaveBeenCalled();
    });
  });
});

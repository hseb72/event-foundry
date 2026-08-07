import { ForbiddenException } from '@nestjs/common';
import type { CreateEventDto } from '../../events/dto/create-event.dto';
import { CasesService } from '../../cases/cases.service';
import { ModerationTermsService } from '../../moderation/moderation-terms.service';
import { EventMediaService } from '../../events/services/event-media.service';
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
    provenance: jest.Mock;
    importSource: jest.Mock;
  };
  let eventsService: { buildValidatedEventData: jest.Mock; hasPublicDuplicate: jest.Mock };
  let eventMedia: { attachImportSource: jest.Mock };
  let cases: { open: jest.Mock };
  let moderationTerms: { firstMatch: jest.Mock };
  let service: EventCandidatesService;
  const operator = { userId: 'user-1', isOperator: true, activeOrganizationId: null };

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      reject: jest.fn(),
      createEventAndValidate: jest.fn(),
      // Provenance par défaut : soumission **personnelle** (Explorer), sans organisation.
      provenance: jest.fn().mockResolvedValue({ createdById: 'user-1', organizationId: null }),
      importSource: jest.fn().mockResolvedValue(null),
    };
    eventsService = {
      buildValidatedEventData: jest.fn(),
      hasPublicDuplicate: jest.fn().mockResolvedValue(false),
    };
    eventMedia = { attachImportSource: jest.fn().mockResolvedValue(undefined) };
    cases = { open: jest.fn().mockResolvedValue({ id: 'case-1', reference: 'C-ABCD1234' }) };
    moderationTerms = { firstMatch: jest.fn().mockResolvedValue(null) };
    service = new EventCandidatesService(
      repo as unknown as EventCandidateRepository,
      eventsService as unknown as EventsService,
      eventMedia as unknown as EventMediaService,
      cases as unknown as CasesService,
      moderationTerms as unknown as ModerationTermsService,
    );
  });

  it('refuse toute action sur un candidate VALIDATED', async () => {
    repo.findById.mockResolvedValue({ id: 'c1', status: 'VALIDATED' });
    await expect(service.reject('c1', operator)).rejects.toBeInstanceOf(InvalidCandidateTransitionException);
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

    const event = await service.validate('c1', { activityId: 'a1' } as CreateEventDto, operator);

    expect(event.id).toBe('e1');
    // Soumission personnelle : Event PRIVATE en DRAFT, rattaché au valideur (createdById).
    expect(repo.createEventAndValidate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        source: 'IMPORT',
        status: 'DRAFT',
        visibility: 'PRIVATE',
        organizationId: null,
        createdById: 'user-1',
      }),
      'user-1',
    );
  });

  it("soumission d'organisation → Event PUBLIC rattaché à cette organisation (origine durable)", async () => {
    repo.findById.mockResolvedValue({ id: 'c1', status: 'PENDING' });
    eventsService.buildValidatedEventData.mockResolvedValue({
      source: 'IMPORT',
      activityId: 'a1',
      title: 'T',
      startsAt: '2024-07-12T00:00:00.000Z',
    });
    repo.createEventAndValidate.mockResolvedValue({ id: 'e3' });
    repo.provenance.mockResolvedValue({ createdById: 'org-user', organizationId: 'org-9' });

    await service.validate('c1', { activityId: 'a1' } as CreateEventDto, {
      userId: 'org-user',
      isOperator: true,
      activeOrganizationId: 'org-9',
    });

    expect(repo.createEventAndValidate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ visibility: 'PUBLIC', organizationId: 'org-9' }),
      'org-user',
    );
  });

  it("l'origine prime sur les droits du valideur : un agent sans publication garde l'événement dans son organisation", async () => {
    // Régression : la destination se décidait sur `event.publish`. Un agent « Responsable
    // d'événements » qualifiant un brouillon de son organisation produisait un événement **privé
    // personnel** — l'organisation perdait sa soumission au profit de l'espace personnel de l'agent.
    repo.findById.mockResolvedValue({ id: 'c1', status: 'PENDING' });
    eventsService.buildValidatedEventData.mockResolvedValue({
      source: 'IMPORT',
      activityId: 'a1',
      title: 'T',
      startsAt: '2024-07-12T00:00:00.000Z',
    });
    repo.createEventAndValidate.mockResolvedValue({ id: 'e4' });
    repo.provenance.mockResolvedValue({ createdById: 'agent', organizationId: 'org-9' });

    await service.validate('c1', { activityId: 'a1' } as CreateEventDto, {
      userId: 'agent',
      isOperator: false,
      activeOrganizationId: 'org-9',
    });

    expect(repo.createEventAndValidate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ visibility: 'PUBLIC', organizationId: 'org-9' }),
      'agent',
    );
  });

  it("une soumission personnelle reste privée, même faite par un utilisateur ayant une organisation active", async () => {
    repo.findById.mockResolvedValue({ id: 'c1', status: 'PENDING' });
    eventsService.buildValidatedEventData.mockResolvedValue({
      source: 'IMPORT',
      activityId: 'a1',
      title: 'T',
      startsAt: '2024-07-12T00:00:00.000Z',
    });
    repo.createEventAndValidate.mockResolvedValue({ id: 'e5' });
    repo.provenance.mockResolvedValue({ createdById: 'user-1', organizationId: null });

    await service.validate('c1', { activityId: 'a1' } as CreateEventDto, {
      userId: 'user-1',
      isOperator: true,
      activeOrganizationId: 'org-9',
    });

    expect(repo.createEventAndValidate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ visibility: 'PRIVATE', organizationId: null }),
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

    repo.provenance.mockResolvedValue({ createdById: 'user-2', organizationId: null });
    await service.validate('c1', { activityId: 'a1' } as CreateEventDto, { userId: 'user-2', isOperator: false, activeOrganizationId: null });

    expect(repo.createEventAndValidate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ visibility: 'PRIVATE', createdById: 'user-2' }),
      'user-2',
    );
  });

  it("un agent de l'organisation d'origine peut qualifier le brouillon d'un collègue (FSPEC.22 — vue d'équipe)", async () => {
    repo.findById.mockResolvedValue({ id: 'c1', status: 'PENDING' });
    eventsService.buildValidatedEventData.mockResolvedValue({
      source: 'IMPORT',
      activityId: 'a1',
      title: 'T',
      startsAt: '2024-07-12T00:00:00.000Z',
    });
    repo.createEventAndValidate.mockResolvedValue({ id: 'e3' });
    // Brouillon soumis par le collègue user-A dans l'organisation org-9 ; l'agent user-B, actif dans
    // la même organisation, doit pouvoir agir dessus (absence, départ…).
    repo.provenance.mockResolvedValue({ createdById: 'user-A', organizationId: 'org-9' });

    await service.validate(
      'c1',
      { activityId: 'a1' } as CreateEventDto,
      { userId: 'user-B', isOperator: false, activeOrganizationId: 'org-9' },
    );

    expect(repo.createEventAndValidate).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ visibility: 'PUBLIC', createdById: 'user-B', organizationId: 'org-9' }),
      'user-B',
    );
  });

  it("refuse un brouillon d'une autre organisation (isolation — FSPEC.22)", async () => {
    repo.findById.mockResolvedValue({ id: 'c1', status: 'PENDING' });
    repo.provenance.mockResolvedValue({ createdById: 'user-A', organizationId: 'org-9' });

    await expect(
      service.reject('c1', { userId: 'user-B', isOperator: false, activeOrganizationId: 'org-other' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.reject).not.toHaveBeenCalled();
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
        service.validate('c1', { activityId: 'a1' } as CreateEventDto, operator),
      ).rejects.toBeInstanceOf(SubmissionHeldForReviewException);

      expect(cases.open).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'DATA_CORRECTION', origin: 'EXPLORER', requesterId: 'user-1' }),
      );
      expect(repo.createEventAndValidate).not.toHaveBeenCalled();
    });

    it("doublon public (soumission d'organisation) → Case CONTENT_REPORT + validation retenue", async () => {
      eventsService.buildValidatedEventData.mockResolvedValue({
        source: 'IMPORT',
        activityId: 'a1',
        title: 'Tournoi Magic',
        startsAt: '2024-07-12T18:00:00.000Z',
      });
      eventsService.hasPublicDuplicate.mockResolvedValue(true);
      repo.provenance.mockResolvedValue({ createdById: 'org-1', organizationId: 'org-9' });

      await expect(
        service.validate('c1', { activityId: 'a1' } as CreateEventDto, {
          userId: 'org-1',
          isOperator: true,
          activeOrganizationId: 'org-9',
        }),
      ).rejects.toBeInstanceOf(SubmissionHeldForReviewException);

      expect(cases.open).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CONTENT_REPORT', origin: 'ORGANIZER' }),
      );
      expect(repo.createEventAndValidate).not.toHaveBeenCalled();
    });

    it('contenu interdit (référentiel §13) → Case ABUSE_REPORT + validation retenue', async () => {
      eventsService.buildValidatedEventData.mockResolvedValue({
        source: 'IMPORT',
        activityId: 'a1',
        title: 'Vente arnaque',
        startsAt: '2024-07-12T18:00:00.000Z',
      });
      moderationTerms.firstMatch.mockResolvedValue({ term: 'arnaque', kind: 'BANNED' });

      await expect(
        service.validate('c1', { activityId: 'a1' } as CreateEventDto, operator),
      ).rejects.toBeInstanceOf(SubmissionHeldForReviewException);

      expect(cases.open).toHaveBeenCalledWith(expect.objectContaining({ type: 'ABUSE_REPORT' }));
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

      await service.validate('c1', { activityId: 'a1' } as CreateEventDto, operator);

      // Le doublon n'est pas contrôlé pour une soumission personnelle : pas de Case, Event privé créé.
      expect(eventsService.hasPublicDuplicate).not.toHaveBeenCalled();
      expect(cases.open).not.toHaveBeenCalled();
      expect(repo.createEventAndValidate).toHaveBeenCalled();
    });
  });
});

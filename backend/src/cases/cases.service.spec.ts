import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CasePriority, CaseStatus, type Case } from '@prisma/client';
import type { CasesRepository } from './cases.repository';
import { CasesService } from './cases.service';

describe('CasesService (FSPEC.21)', () => {
  let repository: {
    create: jest.Mock;
    recordEvent: jest.Mock;
    findById: jest.Mock;
    detail: jest.Mock;
    update: jest.Mock;
    referenceExists: jest.Mock;
    listForRequester: jest.Mock;
    activeRoutingRules: jest.Mock;
  };
  let service: CasesService;

  const aCase = (over: Partial<Case> = {}): Case =>
    ({ id: 'c-1', status: CaseStatus.NEW, priority: CasePriority.MEDIUM, requesterId: 'u-1', ...over }) as Case;

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue(aCase()),
      recordEvent: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(aCase()),
      detail: jest.fn(),
      update: jest.fn().mockImplementation((_id, data) => Promise.resolve(aCase(data))),
      referenceExists: jest.fn().mockResolvedValue(false),
      listForRequester: jest.fn(),
      activeRoutingRules: jest.fn().mockResolvedValue([]),
    };
    service = new CasesService(repository as unknown as CasesRepository, { publish: jest.fn(), subscribe: jest.fn() });
  });

  describe('open (routage §9)', () => {
    it('oriente CONTENT_REPORT vers Moderation en priorité haute + historise la création', async () => {
      await service.open({
        type: 'CONTENT_REPORT',
        subject: 'Contenu inapproprié',
        description: '...',
        origin: 'EXPLORER',
        requesterId: 'u-1',
      });
      const created = repository.create.mock.calls[0][0];
      expect(created.domain).toBe('MODERATION');
      expect(created.workQueue).toBe('MODERATION_QUEUE');
      expect(created.priority).toBe(CasePriority.HIGH);
      expect(created.reference).toMatch(/^C-[0-9A-F]{8}$/);
      expect(repository.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ kind: 'CREATED' }));
    });

    it('type inconnu → OTHER, routé vers l’administration (jamais sans destination — CASE-012)', async () => {
      await service.open({ type: 'ZZZ', subject: 'x', description: 'y', origin: 'PLATFORM', requesterId: null });
      const created = repository.create.mock.calls[0][0];
      expect(created.type).toBe('OTHER');
      expect(created.domain).toBe('PLATFORM_ADMIN');
    });
  });

  describe('affectation & cycle de vie', () => {
    it('assign : NEW → ASSIGNED + historique', async () => {
      await service.assign('c-1', 'op-1', 'op-2');
      expect(repository.update).toHaveBeenCalledWith('c-1', { assigneeId: 'op-1', status: CaseStatus.ASSIGNED });
      expect(repository.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ASSIGNED' }));
    });

    it('changeStatus : transition invalide rejetée (§11)', async () => {
      repository.findById.mockResolvedValue(aCase({ status: CaseStatus.NEW }));
      await expect(service.changeStatus('c-1', CaseStatus.RESOLVED, 'op-1', 'motif')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('changeStatus : commentaire obligatoire (tout changement de statut est motivé)', async () => {
      repository.findById.mockResolvedValue(aCase({ status: CaseStatus.IN_PROGRESS }));
      await expect(
        service.changeStatus('c-1', CaseStatus.WAITING_FOR_USER, 'op-1', '   '),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('changeStatus WAITING_FOR_USER : motif public + notification au demandeur avec le message', async () => {
      repository.findById.mockResolvedValue(aCase({ status: CaseStatus.IN_PROGRESS }));
      const publish = jest.fn();
      service = new CasesService(repository as unknown as CasesRepository, { publish, subscribe: jest.fn() });
      await service.changeStatus('c-1', CaseStatus.WAITING_FOR_USER, 'op-1', 'Merci de fournir la facture.');
      expect(repository.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'STATUS_CHANGED', visibility: 'PUBLIC', body: 'Merci de fournir la facture.' }),
      );
      expect(publish).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({ status: 'WAITING_FOR_USER', message: 'Merci de fournir la facture.' }),
        }),
      );
    });

    it('reroute : change de domaine/file, réinitialise l’affectation, exige un motif', async () => {
      repository.findById.mockResolvedValue(aCase({ status: CaseStatus.NEW, domain: 'BACKEND_SUPPORT', workQueue: 'BACKEND_SUPPORT_QUEUE' }));
      await expect(service.reroute('c-1', 'FINANCE', 'op-1', '  ')).rejects.toBeInstanceOf(BadRequestException);
      await service.reroute('c-1', 'FINANCE', 'op-1', 'Mauvaise file, relève de la facturation.');
      expect(repository.update).toHaveBeenCalledWith('c-1', {
        domain: 'FINANCE',
        workQueue: 'FINANCE_QUEUE',
        assigneeId: null,
      });
      expect(repository.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ kind: 'REROUTED' }));
    });

    it('addRequesterComment : commentaire public + sortie d’attente (WAITING_FOR_USER → IN_PROGRESS)', async () => {
      repository.findById.mockResolvedValue(aCase({ status: CaseStatus.WAITING_FOR_USER, requesterId: 'u-1' }));
      await service.addRequesterComment('c-1', 'u-1', 'Voici les éléments demandés.');
      expect(repository.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'COMMENT', visibility: 'PUBLIC', actorId: 'u-1' }),
      );
      expect(repository.update).toHaveBeenCalledWith('c-1', { status: CaseStatus.IN_PROGRESS });
    });

    it('addRequesterComment : un tiers ne peut pas répondre à la demande', async () => {
      repository.findById.mockResolvedValue(aCase({ status: CaseStatus.WAITING_FOR_USER, requesterId: 'u-1' }));
      await expect(service.addRequesterComment('c-1', 'intrus', 'x')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('changeStatus : CLOSED renseigne la date de clôture', async () => {
      repository.findById.mockResolvedValue(aCase({ status: CaseStatus.RESOLVED }));
      await service.changeStatus('c-1', CaseStatus.CLOSED, 'op-1', 'clôture justifiée');
      const data = repository.update.mock.calls[0][1];
      expect(data.status).toBe(CaseStatus.CLOSED);
      expect(data.closedAt).toBeInstanceOf(Date);
    });

    it('escalate : priorité CRITICAL + historique (CASE-011)', async () => {
      await service.escalate('c-1', 'op-1', 'urgent');
      expect(repository.update).toHaveBeenCalledWith('c-1', { priority: CasePriority.CRITICAL });
      expect(repository.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ESCALATED' }));
    });
  });

  describe('demandeur', () => {
    it('detailForRequester : masque les échanges internes et interdit l’accès d’un tiers', async () => {
      repository.detail.mockResolvedValue({
        id: 'c-1',
        requesterId: 'u-1',
        events: [
          { id: 'e1', visibility: 'PUBLIC' },
          { id: 'e2', visibility: 'INTERNAL' },
        ],
      });
      const res = await service.detailForRequester('c-1', 'u-1');
      expect((res.events as { id: string }[]).map((e) => e.id)).toEqual(['e1']);

      await expect(service.detailForRequester('c-1', 'intrus')).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});

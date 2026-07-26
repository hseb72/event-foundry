import { BadRequestException } from '@nestjs/common';
import { EventStatus, type Case, type ModerationLog } from '@prisma/client';
import type { CasesService } from '../cases/cases.service';
import type { SearchIndexService } from '../search/services/search-index.service';
import { ModerationService } from './moderation.service';
import type { ModerationRepository } from './moderation.repository';

describe('ModerationService (FSPEC.20)', () => {
  let repository: {
    eventExists: jest.Mock;
    setEventStatus: jest.Mock;
    organizationExists: jest.Mock;
    setOrganizationActive: jest.Mock;
    recordLog: jest.Mock;
    history: jest.Mock;
  };
  let cases: { open: jest.Mock; getCase: jest.Mock; logEvent: jest.Mock };
  let search: { index: jest.Mock; remove: jest.Mock };
  let service: ModerationService;

  const eventCase = (): Case =>
    ({ id: 'case-1', metadata: { objectType: 'EVENT', objectId: 'ev-1' } }) as unknown as Case;

  beforeEach(() => {
    repository = {
      eventExists: jest.fn().mockResolvedValue(true),
      setEventStatus: jest.fn().mockResolvedValue(undefined),
      organizationExists: jest.fn().mockResolvedValue(true),
      setOrganizationActive: jest.fn().mockResolvedValue(undefined),
      recordLog: jest.fn().mockResolvedValue({ id: 'log-1' } as ModerationLog),
      history: jest.fn(),
    };
    cases = {
      open: jest.fn().mockResolvedValue({ id: 'case-1', reference: 'C-ABC' }),
      getCase: jest.fn().mockResolvedValue(eventCase()),
      logEvent: jest.fn().mockResolvedValue(undefined),
    };
    search = { index: jest.fn().mockResolvedValue(undefined), remove: jest.fn().mockResolvedValue(undefined) };
    service = new ModerationService(
      repository as unknown as ModerationRepository,
      cases as unknown as CasesService,
      search as unknown as SearchIndexService,
    );
  });

  describe('report', () => {
    it('offensant → ABUSE_REPORT, cible en métadonnées', async () => {
      await service.report('u-1', 'EXPLORER', { objectType: 'EVENT', objectId: 'ev-1' }, 'OFFENSIVE', 'grave');
      const opened = cases.open.mock.calls[0][0];
      expect(opened.type).toBe('ABUSE_REPORT');
      expect(opened.metadata).toEqual({ objectType: 'EVENT', objectId: 'ev-1', reason: 'OFFENSIVE' });
    });

    it('doublon → CONTENT_REPORT', async () => {
      await service.report('u-1', 'EXPLORER', { objectType: 'EVENT', objectId: 'ev-1' }, 'DUPLICATE');
      expect(cases.open.mock.calls[0][0].type).toBe('CONTENT_REPORT');
    });
  });

  describe('decide', () => {
    it('HIDE sans justification → rejet (MOD-004)', async () => {
      await expect(service.decide('case-1', 'op-1', 'HIDE')).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.setEventStatus).not.toHaveBeenCalled();
    });

    it('HIDE un événement → archivé + retiré de la recherche + journalisé', async () => {
      await service.decide('case-1', 'op-1', 'HIDE', 'contenu trompeur');
      expect(repository.setEventStatus).toHaveBeenCalledWith('ev-1', EventStatus.ARCHIVED);
      expect(search.remove).toHaveBeenCalledWith('ev-1');
      expect(repository.recordLog).toHaveBeenCalledWith(expect.objectContaining({ decision: 'HIDE', objectType: 'EVENT' }));
      expect(cases.logEvent).toHaveBeenCalledWith('case-1', 'op-1', 'MODERATION_DECISION', 'contenu trompeur', expect.any(Object));
    });

    it('RESTORE un événement → republié + réindexé', async () => {
      await service.decide('case-1', 'op-1', 'RESTORE', 'signalement infondé');
      expect(repository.setEventStatus).toHaveBeenCalledWith('ev-1', EventStatus.PUBLISHED);
      expect(search.index).toHaveBeenCalledWith('ev-1');
    });

    it('SUSPEND une organisation → désactivée', async () => {
      cases.getCase.mockResolvedValue({ id: 'case-1', metadata: { objectType: 'ORGANIZATION', objectId: 'org-1' } } as unknown as Case);
      await service.decide('case-1', 'op-1', 'SUSPEND', 'fraude avérée');
      expect(repository.setOrganizationActive).toHaveBeenCalledWith('org-1', false);
    });

    it('NO_ACTION → aucun effet sur l’objet, mais historisé', async () => {
      await service.decide('case-1', 'op-1', 'NO_ACTION');
      expect(repository.setEventStatus).not.toHaveBeenCalled();
      expect(repository.recordLog).toHaveBeenCalledWith(expect.objectContaining({ decision: 'NO_ACTION' }));
    });

    it('Case sans objet modérable → rejet', async () => {
      cases.getCase.mockResolvedValue({ id: 'case-1', metadata: {} } as unknown as Case);
      await expect(service.decide('case-1', 'op-1', 'NO_ACTION')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

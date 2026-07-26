import { NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ReauthenticationFailedException } from '../exceptions/reauthentication-failed.exception';
import type { AccountRepository } from '../repositories/account.repository';
import { AccountPrivacyService } from './account-privacy.service';
import type { SecurityAuditService } from './security-audit.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AccountPrivacyService — RGPD (FSPEC.18 §14)', () => {
  let repository: {
    gatherPersonalData: jest.Mock;
    listSecurityEvents: jest.Mock;
    findUserById: jest.Mock;
    anonymizeAccount: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let service: AccountPrivacyService;

  const user = { id: 'u-1', passwordHash: 'hash' } as User;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      gatherPersonalData: jest.fn(),
      listSecurityEvents: jest.fn().mockResolvedValue([]),
      findUserById: jest.fn().mockResolvedValue(user),
      anonymizeAccount: jest.fn().mockResolvedValue(undefined),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new AccountPrivacyService(
      repository as unknown as AccountRepository,
      audit as unknown as SecurityAuditService,
    );
  });

  describe('exportData', () => {
    it('agrège les données personnelles et historise l’export', async () => {
      repository.gatherPersonalData.mockResolvedValue({
        id: 'u-1',
        email: 'u@b.c',
        displayName: 'U',
        status: 'ACTIVE',
        emailVerifiedAt: null,
        preferences: { theme: 'dark' },
        createdAt: new Date('2026-01-01'),
        roles: [{ role: { name: 'Explorer' } }],
        memberships: [],
        participations: [{ eventId: 'e-1', interested: true, reservationStatus: 'NONE', paymentStatus: 'NONE' }],
        follows: [],
        notifications: [],
      });
      const result = await service.exportData('u-1');
      expect((result.account as { roles: string[] }).roles).toEqual(['Explorer']);
      expect(result.preferences).toEqual({ theme: 'dark' });
      expect(audit.record).toHaveBeenCalledWith('account.data_exported', 'u-1');
    });

    it('compte introuvable → 404', async () => {
      repository.gatherPersonalData.mockResolvedValue(null);
      await expect(service.exportData('u-x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteOwnAccount', () => {
    it('réauthentification échouée → aucune anonymisation', async () => {
      bcryptMock.compare.mockResolvedValue(false as never);
      await expect(service.deleteOwnAccount('u-1', 'faux')).rejects.toBeInstanceOf(
        ReauthenticationFailedException,
      );
      expect(repository.anonymizeAccount).not.toHaveBeenCalled();
    });

    it('mot de passe correct → audit puis anonymisation (e-mail deleted.invalid)', async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      await service.deleteOwnAccount('u-1', 'bon');
      expect(audit.record).toHaveBeenCalledWith('account.deleted', 'u-1', { self: true });
      const [id, email] = repository.anonymizeAccount.mock.calls[0];
      expect(id).toBe('u-1');
      expect(email).toMatch(/^deleted-.*@deleted\.invalid$/);
    });
  });
});

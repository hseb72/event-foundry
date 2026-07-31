import { BadRequestException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ReauthenticationFailedException } from '../exceptions/reauthentication-failed.exception';
import type { AccountRepository } from '../repositories/account.repository';
import { AccountMfaService } from './account-mfa.service';
import type { SecurityAuditService } from './security-audit.service';
import { generateTotpSecret } from './totp.util';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;
const hashRecovery = (c: string): string => createHash('sha256').update(c).digest('hex');

describe('AccountMfaService (FSPEC.18 §MFA)', () => {
  let repository: {
    findUserById: jest.Mock;
    setMfaSecret: jest.Mock;
    enableMfa: jest.Mock;
    disableMfa: jest.Mock;
    setRecoveryCodes: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let service: AccountMfaService;

  const user = (over: Partial<User> = {}): User =>
    ({ id: 'u-1', email: 'u@b.c', passwordHash: 'hash', mfaSecret: null, mfaEnabledAt: null, mfaRecoveryCodes: [], ...over }) as User;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      findUserById: jest.fn().mockResolvedValue(user()),
      setMfaSecret: jest.fn().mockResolvedValue(undefined),
      enableMfa: jest.fn().mockResolvedValue(undefined),
      disableMfa: jest.fn().mockResolvedValue(undefined),
      setRecoveryCodes: jest.fn().mockResolvedValue(undefined),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new AccountMfaService(
      repository as unknown as AccountRepository,
      audit as unknown as SecurityAuditService,
    );
  });

  it('setup : génère un secret en attente + URI otpauth', async () => {
    const res = await service.setup('u-1');
    expect(repository.setMfaSecret).toHaveBeenCalledWith('u-1', res.secret);
    expect(res.otpauthUri).toContain('otpauth://totp/');
  });

  it('enable : code invalide → rejet, pas d’activation', async () => {
    repository.findUserById.mockResolvedValue(user({ mfaSecret: generateTotpSecret() }));
    await expect(service.enable('u-1', '000000')).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.enableMfa).not.toHaveBeenCalled();
  });

  it('disable : réauthentification requise', async () => {
    bcryptMock.compare.mockResolvedValue(false as never);
    await expect(service.disable('u-1', 'faux')).rejects.toBeInstanceOf(ReauthenticationFailedException);
    expect(repository.disableMfa).not.toHaveBeenCalled();
  });

  it('verifySecondFactor : code de récupération valide → consommé (usage unique)', async () => {
    const u = user({ mfaEnabledAt: new Date(), mfaRecoveryCodes: [hashRecovery('ABCDE12345')] });
    const ok = await service.verifySecondFactor(u, 'abcde12345');
    expect(ok).toBe(true);
    expect(repository.setRecoveryCodes).toHaveBeenCalledWith('u-1', []); // code retiré
    expect(audit.record).toHaveBeenCalledWith('account.mfa_recovery_used', 'u-1');
  });

  it('verifySecondFactor : code inconnu → false', async () => {
    const u = user({ mfaEnabledAt: new Date(), mfaRecoveryCodes: [hashRecovery('ABCDE12345')] });
    expect(await service.verifySecondFactor(u, '999999')).toBe(false);
  });
});

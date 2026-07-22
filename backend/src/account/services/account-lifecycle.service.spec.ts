import { AccountTokenType, type AccountToken, type User } from '@prisma/client';
import { InvalidAccountTokenException } from '../exceptions/invalid-account-token.exception';
import type { AccountRepository } from '../repositories/account.repository';
import { AccountLifecycleService } from './account-lifecycle.service';
import type { AccountLinkMailer } from './account-link-mailer.service';
import type { SecurityAuditService } from './security-audit.service';

describe('AccountLifecycleService — vérification d’e-mail (FSPEC.18 / IAM-003..005)', () => {
  let repository: {
    invalidateTokens: jest.Mock;
    createToken: jest.Mock;
    findValidToken: jest.Mock;
    consumeToken: jest.Mock;
    findUserByEmail: jest.Mock;
    markEmailVerified: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let mailer: { deliver: jest.Mock };
  let service: AccountLifecycleService;

  beforeEach(() => {
    repository = {
      invalidateTokens: jest.fn().mockResolvedValue(undefined),
      createToken: jest.fn().mockResolvedValue({ id: 't-1' } as AccountToken),
      findValidToken: jest.fn(),
      consumeToken: jest.fn().mockResolvedValue(1),
      findUserByEmail: jest.fn(),
      markEmailVerified: jest.fn().mockResolvedValue({} as User),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    mailer = { deliver: jest.fn() };
    service = new AccountLifecycleService(
      repository as unknown as AccountRepository,
      audit as unknown as SecurityAuditService,
      mailer as unknown as AccountLinkMailer,
    );
  });

  it("émettre un lien invalide les liens précédents et ne stocke qu'une empreinte", async () => {
    await service.issueEmailVerification({ id: 'u-1', email: 'a@b.c' });

    expect(repository.invalidateTokens).toHaveBeenCalledWith('u-1', AccountTokenType.EMAIL_VERIFICATION);
    const created = repository.createToken.mock.calls[0][0];
    expect(created.tokenHash).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex, jamais le jeton en clair
    expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(audit.record).toHaveBeenCalledWith('account.email_verification_sent', 'u-1');
  });

  it('vérifier avec un jeton valide consomme le jeton et active le compte', async () => {
    repository.findValidToken.mockResolvedValue({ id: 't-1', userId: 'u-1' } as AccountToken);

    await service.verifyEmail('raw-token');

    expect(repository.consumeToken).toHaveBeenCalledWith('t-1');
    expect(repository.markEmailVerified).toHaveBeenCalledWith('u-1');
    expect(audit.record).toHaveBeenCalledWith('account.email_verified', 'u-1');
  });

  it('jeton inconnu/expiré → exception explicite, aucun effet', async () => {
    repository.findValidToken.mockResolvedValue(null);
    await expect(service.verifyEmail('bad')).rejects.toBeInstanceOf(InvalidAccountTokenException);
    expect(repository.markEmailVerified).not.toHaveBeenCalled();
  });

  it('usage unique : un jeton déjà consommé en course est rejeté (IAM-005)', async () => {
    repository.findValidToken.mockResolvedValue({ id: 't-1', userId: 'u-1' } as AccountToken);
    repository.consumeToken.mockResolvedValue(0);
    await expect(service.verifyEmail('raw')).rejects.toBeInstanceOf(InvalidAccountTokenException);
    expect(repository.markEmailVerified).not.toHaveBeenCalled();
  });

  it('renvoi : silencieux pour un compte inconnu ou déjà vérifié (pas d’énumération)', async () => {
    repository.findUserByEmail.mockResolvedValue(null);
    await service.resendVerification('inconnu@b.c');
    expect(repository.createToken).not.toHaveBeenCalled();

    repository.findUserByEmail.mockResolvedValue({
      id: 'u-1',
      emailVerifiedAt: new Date(),
      isActive: true,
    } as User);
    await service.resendVerification('a@b.c');
    expect(repository.createToken).not.toHaveBeenCalled();
  });

  it('renvoi : ré-émet pour un compte non vérifié', async () => {
    repository.findUserByEmail.mockResolvedValue({
      id: 'u-1',
      email: 'a@b.c',
      emailVerifiedAt: null,
      isActive: true,
    } as User);
    await service.resendVerification('a@b.c');
    expect(repository.createToken).toHaveBeenCalledTimes(1);
  });
});

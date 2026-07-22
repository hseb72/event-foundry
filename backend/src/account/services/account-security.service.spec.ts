import { AccountTokenType, type AccountToken, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EmailNotAvailableException } from '../exceptions/email-not-available.exception';
import { InvalidAccountTokenException } from '../exceptions/invalid-account-token.exception';
import { ReauthenticationFailedException } from '../exceptions/reauthentication-failed.exception';
import type { AccountRepository } from '../repositories/account.repository';
import type { AccountLinkMailer } from './account-link-mailer.service';
import { AccountSecurityService } from './account-security.service';
import type { SecurityAuditService } from './security-audit.service';

jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AccountSecurityService — mots de passe & changement d’e-mail (FSPEC.18 §9–11)', () => {
  let repository: {
    findUserById: jest.Mock;
    findUserByEmail: jest.Mock;
    updatePassword: jest.Mock;
    replaceEmail: jest.Mock;
    emailInUse: jest.Mock;
    invalidateTokens: jest.Mock;
    createToken: jest.Mock;
    findValidToken: jest.Mock;
    consumeToken: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let mailer: { deliver: jest.Mock };
  let service: AccountSecurityService;

  const user = { id: 'u-1', email: 'old@b.c', passwordHash: 'hashed', isActive: true } as User;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      findUserById: jest.fn().mockResolvedValue(user),
      findUserByEmail: jest.fn().mockResolvedValue(user),
      updatePassword: jest.fn().mockResolvedValue(user),
      replaceEmail: jest.fn().mockResolvedValue(user),
      emailInUse: jest.fn().mockResolvedValue(false),
      invalidateTokens: jest.fn().mockResolvedValue(undefined),
      createToken: jest.fn().mockResolvedValue({ id: 't-1' } as AccountToken),
      findValidToken: jest.fn(),
      consumeToken: jest.fn().mockResolvedValue(1),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    mailer = { deliver: jest.fn() };
    bcryptMock.hash.mockResolvedValue('new-hash' as never);
    service = new AccountSecurityService(
      repository as unknown as AccountRepository,
      audit as unknown as SecurityAuditService,
      mailer as unknown as AccountLinkMailer,
    );
  });

  describe('changePassword', () => {
    it('exige le mot de passe actuel (IAM-008)', async () => {
      bcryptMock.compare.mockResolvedValue(false as never);
      await expect(service.changePassword('u-1', 'faux', 'nouveau-mdp')).rejects.toBeInstanceOf(
        ReauthenticationFailedException,
      );
      expect(repository.updatePassword).not.toHaveBeenCalled();
    });

    it('remplace le mot de passe et invalide les liens de récupération (AC-IAM-006)', async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      await service.changePassword('u-1', 'actuel', 'nouveau-mdp');
      expect(repository.updatePassword).toHaveBeenCalledWith('u-1', 'new-hash');
      expect(repository.invalidateTokens).toHaveBeenCalledWith('u-1', AccountTokenType.PASSWORD_RESET);
      expect(audit.record).toHaveBeenCalledWith('account.password_changed', 'u-1');
    });
  });

  describe('requestPasswordReset', () => {
    it('silencieux pour un compte inconnu ou suspendu (pas d’énumération)', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      await service.requestPasswordReset('inconnu@b.c');
      expect(repository.createToken).not.toHaveBeenCalled();

      repository.findUserByEmail.mockResolvedValue({ ...user, isActive: false } as User);
      await service.requestPasswordReset('old@b.c');
      expect(repository.createToken).not.toHaveBeenCalled();
    });

    it('émet un lien court à usage unique et invalide les précédents', async () => {
      await service.requestPasswordReset('old@b.c');
      expect(repository.invalidateTokens).toHaveBeenCalledWith('u-1', AccountTokenType.PASSWORD_RESET);
      const created = repository.createToken.mock.calls[0][0];
      expect(created.type).toBe(AccountTokenType.PASSWORD_RESET);
      expect(created.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      // TTL court (1 h) : bien inférieur à la vérification d'e-mail (48 h).
      expect(created.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 3600_000 + 1000);
      expect(mailer.deliver).toHaveBeenCalledWith('old@b.c', 'reset-password', expect.any(String));
    });
  });

  describe('resetPassword', () => {
    it('jeton valide → nouveau mot de passe + purge des jetons restants', async () => {
      repository.findValidToken.mockResolvedValue({ id: 't-1', userId: 'u-1' } as AccountToken);
      await service.resetPassword('raw', 'nouveau-mdp');
      expect(repository.updatePassword).toHaveBeenCalledWith('u-1', 'new-hash');
      expect(repository.invalidateTokens).toHaveBeenCalledWith('u-1', AccountTokenType.PASSWORD_RESET);
      expect(audit.record).toHaveBeenCalledWith('account.password_reset_completed', 'u-1');
    });

    it('jeton invalide ou déjà consommé → rejet sans effet (IAM-005)', async () => {
      repository.findValidToken.mockResolvedValue(null);
      await expect(service.resetPassword('bad', 'x'.repeat(10))).rejects.toBeInstanceOf(
        InvalidAccountTokenException,
      );
      expect(repository.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('changement d’e-mail', () => {
    it('demande : réauthentification + unicité, lien envoyé à la NOUVELLE adresse', async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      await service.requestEmailChange('u-1', 'actuel', 'new@b.c');
      const created = repository.createToken.mock.calls[0][0];
      expect(created.type).toBe(AccountTokenType.EMAIL_CHANGE);
      expect(created.payload).toEqual({ newEmail: 'new@b.c' });
      expect(mailer.deliver).toHaveBeenCalledWith('new@b.c', 'confirm-email-change', expect.any(String));
    });

    it('demande : adresse déjà prise → conflit (IAM-002)', async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      repository.emailInUse.mockResolvedValue(true);
      await expect(service.requestEmailChange('u-1', 'actuel', 'pris@b.c')).rejects.toBeInstanceOf(
        EmailNotAvailableException,
      );
      expect(repository.createToken).not.toHaveBeenCalled();
    });

    it('confirmation : applique la nouvelle adresse, vérifiée, avec audit from→to (IAM-004)', async () => {
      repository.findValidToken.mockResolvedValue({
        id: 't-1',
        userId: 'u-1',
        payload: { newEmail: 'new@b.c' },
      } as unknown as AccountToken);

      await service.confirmEmailChange('raw');

      expect(repository.replaceEmail).toHaveBeenCalledWith('u-1', 'new@b.c');
      expect(audit.record).toHaveBeenCalledWith('account.email_changed', 'u-1', {
        from: 'old@b.c',
        to: 'new@b.c',
      });
    });

    it("confirmation : l'adresse prise entre-temps est refusée au moment de l'application", async () => {
      repository.findValidToken.mockResolvedValue({
        id: 't-1',
        userId: 'u-1',
        payload: { newEmail: 'new@b.c' },
      } as unknown as AccountToken);
      repository.emailInUse.mockResolvedValue(true);

      await expect(service.confirmEmailChange('raw')).rejects.toBeInstanceOf(EmailNotAvailableException);
      expect(repository.replaceEmail).not.toHaveBeenCalled();
    });
  });
});

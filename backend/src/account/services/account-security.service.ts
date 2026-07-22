import { Injectable } from '@nestjs/common';
import { AccountTokenType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { EmailNotAvailableException } from '../exceptions/email-not-available.exception';
import { InvalidAccountTokenException } from '../exceptions/invalid-account-token.exception';
import { ReauthenticationFailedException } from '../exceptions/reauthentication-failed.exception';
import { AccountRepository } from '../repositories/account.repository';
import { AccountLinkMailer } from './account-link-mailer.service';
import { accountTokenExpiry, generateAccountToken, hashAccountToken } from './account-token.util';
import { SECURITY_EVENTS, SecurityAuditService } from './security-audit.service';

const SALT_ROUNDS = 12;
/** Lien de récupération : volontairement court (FSPEC.18 §11). */
const PASSWORD_RESET_TTL_HOURS = 1;
/** Lien de confirmation de changement d'adresse (FSPEC.18 §9). */
const EMAIL_CHANGE_TTL_HOURS = 24;

/**
 * Opérations de sécurité du compte (FSPEC.18 §9–11) : changement de mot de passe (réauthentification
 * — IAM-008), récupération par lien à usage unique (IAM-005) et changement d'adresse e-mail avec
 * confirmation sur la **nouvelle** adresse (IAM-004 — l'ancienne reste valide jusqu'à confirmation).
 * Toute opération est auditée (IAM-009) ; tout changement de mot de passe invalide les liens de
 * récupération en cours (AC-IAM-006).
 */
@Injectable()
export class AccountSecurityService {
  constructor(
    private readonly repository: AccountRepository,
    private readonly audit: SecurityAuditService,
    private readonly mailer: AccountLinkMailer,
  ) {}

  /** Changement de mot de passe par l'utilisateur connecté (mot de passe actuel requis — §10). */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repository.findUserById(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new ReauthenticationFailedException();
    }
    await this.repository.updatePassword(userId, await bcrypt.hash(newPassword, SALT_ROUNDS));
    // AC-IAM-006 : plus aucun lien de récupération encore valide après un changement.
    await this.repository.invalidateTokens(userId, AccountTokenType.PASSWORD_RESET);
    await this.audit.record(SECURITY_EVENTS.PASSWORD_CHANGED, userId);
  }

  /**
   * « Mot de passe oublié » (§11) : émet un lien de récupération court et à usage unique. Réponse
   * silencieuse quel que soit le compte (pas d'énumération). Un compte suspendu ne reçoit rien.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.repository.findUserByEmail(email);
    if (!user || !user.isActive) {
      return;
    }
    await this.repository.invalidateTokens(user.id, AccountTokenType.PASSWORD_RESET);
    const raw = generateAccountToken();
    await this.repository.createToken({
      userId: user.id,
      type: AccountTokenType.PASSWORD_RESET,
      tokenHash: hashAccountToken(raw),
      expiresAt: accountTokenExpiry(PASSWORD_RESET_TTL_HOURS),
    });
    await this.mailer.deliver(user.email, 'reset-password', raw);
    await this.audit.record(SECURITY_EVENTS.PASSWORD_RESET_REQUESTED, user.id);
  }

  /** Applique un nouveau mot de passe à partir d'un lien de récupération valide (usage unique). */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const token = await this.repository.findValidToken(
      hashAccountToken(rawToken),
      AccountTokenType.PASSWORD_RESET,
    );
    if (!token || (await this.repository.consumeToken(token.id)) === 0) {
      throw new InvalidAccountTokenException();
    }
    await this.repository.updatePassword(token.userId, await bcrypt.hash(newPassword, SALT_ROUNDS));
    // Le lien consommé invalide aussi ses éventuels prédécesseurs restants.
    await this.repository.invalidateTokens(token.userId, AccountTokenType.PASSWORD_RESET);
    await this.audit.record(SECURITY_EVENTS.PASSWORD_RESET_COMPLETED, token.userId);
  }

  /**
   * Demande de changement d'adresse (§9) : réauthentification (IAM-008), unicité de la nouvelle
   * adresse (IAM-002), puis lien de confirmation envoyé **à la nouvelle adresse**. L'ancienne
   * adresse reste l'identifiant de connexion tant que la nouvelle n'est pas confirmée.
   */
  async requestEmailChange(userId: string, currentPassword: string, newEmail: string): Promise<void> {
    const user = await this.repository.findUserById(userId);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new ReauthenticationFailedException();
    }
    if (await this.repository.emailInUse(newEmail, userId)) {
      throw new EmailNotAvailableException(newEmail);
    }
    await this.repository.invalidateTokens(userId, AccountTokenType.EMAIL_CHANGE);
    const raw = generateAccountToken();
    await this.repository.createToken({
      userId,
      type: AccountTokenType.EMAIL_CHANGE,
      tokenHash: hashAccountToken(raw),
      expiresAt: accountTokenExpiry(EMAIL_CHANGE_TTL_HOURS),
      payload: { newEmail },
    });
    await this.mailer.deliver(newEmail, 'confirm-email-change', raw);
    await this.audit.record(SECURITY_EVENTS.EMAIL_CHANGE_REQUESTED, userId);
  }

  /** Confirme le changement d'adresse depuis le lien reçu sur la nouvelle adresse (IAM-004). */
  async confirmEmailChange(rawToken: string): Promise<void> {
    const token = await this.repository.findValidToken(
      hashAccountToken(rawToken),
      AccountTokenType.EMAIL_CHANGE,
    );
    if (!token || (await this.repository.consumeToken(token.id)) === 0) {
      throw new InvalidAccountTokenException();
    }
    const newEmail = (token.payload as { newEmail?: string } | null)?.newEmail;
    if (!newEmail) {
      throw new InvalidAccountTokenException();
    }
    // Re-contrôle d'unicité au moment de l'application (l'adresse a pu être prise entre-temps).
    if (await this.repository.emailInUse(newEmail, token.userId)) {
      throw new EmailNotAvailableException(newEmail);
    }
    const previous = await this.repository.findUserById(token.userId);
    await this.repository.replaceEmail(token.userId, newEmail);
    await this.audit.record(SECURITY_EVENTS.EMAIL_CHANGED, token.userId, {
      from: previous?.email,
      to: newEmail,
    });
  }
}

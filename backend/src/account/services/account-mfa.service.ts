import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { ReauthenticationFailedException } from '../exceptions/reauthentication-failed.exception';
import { AccountRepository } from '../repositories/account.repository';
import { SECURITY_EVENTS, SecurityAuditService } from './security-audit.service';
import { generateTotpSecret, totpAuthUri, verifyTotp } from './totp.util';

const RECOVERY_CODE_COUNT = 8;

/**
 * Authentification multifacteur (FSPEC.18 §MFA) : configuration TOTP (secret + URI d'appro),
 * activation après vérification d'un premier code, désactivation (réauthentifiée), et vérification
 * d'un code à la connexion (TOTP ou **code de récupération** à usage unique). Les codes de
 * récupération sont stockés hachés ; le secret TOTP reste côté compte (chiffrement au repos à
 * brancher via le Secrets Management en production).
 */
@Injectable()
export class AccountMfaService {
  constructor(
    private readonly repository: AccountRepository,
    private readonly audit: SecurityAuditService,
  ) {}

  async status(userId: string): Promise<{ enabled: boolean }> {
    const user = await this.userOrThrow(userId);
    return { enabled: user.mfaEnabledAt != null };
  }

  /** Démarre la configuration : génère un secret (en attente) et renvoie le secret + l'URI otpauth. */
  async setup(userId: string): Promise<{ secret: string; otpauthUri: string }> {
    const user = await this.userOrThrow(userId);
    if (user.mfaEnabledAt) {
      throw new BadRequestException('Le MFA est déjà activé. Désactivez-le d’abord pour le reconfigurer.');
    }
    const secret = generateTotpSecret();
    await this.repository.setMfaSecret(userId, secret);
    return { secret, otpauthUri: totpAuthUri(secret, user.email) };
  }

  /** Active le MFA après vérification d'un premier code. Renvoie les codes de récupération (une fois). */
  async enable(userId: string, code: string): Promise<{ recoveryCodes: string[] }> {
    const user = await this.userOrThrow(userId);
    if (!user.mfaSecret) {
      throw new BadRequestException('Aucune configuration MFA en cours. Lancez d’abord la configuration.');
    }
    if (!verifyTotp(user.mfaSecret, code)) {
      throw new BadRequestException('Code invalide.');
    }
    const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, () =>
      randomBytes(5).toString('hex').toUpperCase(),
    );
    await this.repository.enableMfa(userId, recoveryCodes.map(hashRecovery));
    await this.audit.record(SECURITY_EVENTS.MFA_ENABLED, userId);
    return { recoveryCodes };
  }

  /** Désactive le MFA après réauthentification par mot de passe (opération sensible — IAM-008). */
  async disable(userId: string, currentPassword: string): Promise<void> {
    const user = await this.userOrThrow(userId);
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new ReauthenticationFailedException();
    }
    await this.repository.disableMfa(userId);
    await this.audit.record(SECURITY_EVENTS.MFA_DISABLED, userId);
  }

  /**
   * Vérifie un code de second facteur à la connexion : d'abord TOTP, sinon un code de récupération
   * (à usage unique — consommé). Renvoie `true` si le facteur est validé.
   */
  async verifySecondFactor(user: User, code: string): Promise<boolean> {
    if (user.mfaSecret && verifyTotp(user.mfaSecret, code)) {
      return true;
    }
    const hash = hashRecovery(code.replace(/\s/g, '').toUpperCase());
    if (user.mfaRecoveryCodes.includes(hash)) {
      await this.repository.setRecoveryCodes(user.id, user.mfaRecoveryCodes.filter((c) => c !== hash));
      await this.audit.record(SECURITY_EVENTS.MFA_RECOVERY_USED, user.id);
      return true;
    }
    return false;
  }

  private async userOrThrow(userId: string): Promise<User> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }
    return user;
  }
}

/** Empreinte d'un code de récupération (jamais stocké en clair). */
function hashRecovery(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

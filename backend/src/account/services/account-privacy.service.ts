import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { ReauthenticationFailedException } from '../exceptions/reauthentication-failed.exception';
import { AccountRepository } from '../repositories/account.repository';
import { SECURITY_EVENTS, SecurityAuditService } from './security-audit.service';

/** Domaine d'anonymisation : adresse de remplacement garantie unique et non ré-attribuable. */
const ANONYMIZED_EMAIL_DOMAIN = 'deleted.invalid';

/**
 * Droits RGPD sur le compte (FSPEC.18 §14 / IAM-010) : consultation & export des données
 * personnelles, historique de sécurité, et suppression **par anonymisation** (IAM-007 — la ligne
 * est conservée pour l'intégrité des historiques et de l'audit, les données personnelles sont
 * effacées). Toute suppression exige une réauthentification (IAM-008) et est historisée (IAM-009).
 */
@Injectable()
export class AccountPrivacyService {
  constructor(
    private readonly repository: AccountRepository,
    private readonly audit: SecurityAuditService,
  ) {}

  /** Export des données personnelles (droit de consultation/portabilité). */
  async exportData(userId: string): Promise<Record<string, unknown>> {
    const data = await this.repository.gatherPersonalData(userId);
    if (!data) {
      throw new NotFoundException('Compte introuvable.');
    }
    await this.audit.record(SECURITY_EVENTS.DATA_EXPORTED, userId);
    return {
      exportedAt: new Date().toISOString(),
      account: {
        id: data.id,
        email: data.email,
        displayName: data.displayName,
        status: data.status,
        emailVerifiedAt: data.emailVerifiedAt,
        createdAt: data.createdAt,
        roles: data.roles.map((r) => r.role.name),
      },
      preferences: data.preferences ?? {},
      memberships: data.memberships.map((m) => ({ organization: m.organization.name, since: m.createdAt })),
      participations: data.participations,
      follows: data.follows,
      notifications: data.notifications,
    };
  }

  /** Journal de sécurité de l'utilisateur (consultation — §15). */
  securityHistory(userId: string) {
    return this.repository.listSecurityEvents(userId);
  }

  /**
   * Suppression du compte par l'utilisateur (droit à l'effacement). Réauthentification obligatoire,
   * puis anonymisation irréversible. L'audit `account.deleted` est écrit **avant** l'anonymisation
   * (tant que l'utilisateur est encore identifiable), puis conservé.
   */
  async deleteOwnAccount(userId: string, currentPassword: string): Promise<void> {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Compte introuvable.');
    }
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new ReauthenticationFailedException();
    }
    await this.audit.record(SECURITY_EVENTS.ACCOUNT_DELETED, userId, { self: true });
    await this.repository.anonymizeAccount(userId, `deleted-${randomUUID()}@${ANONYMIZED_EMAIL_DOMAIN}`);
  }
}

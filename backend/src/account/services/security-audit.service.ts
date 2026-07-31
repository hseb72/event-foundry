import { Injectable, Logger } from '@nestjs/common';
import { AccountRepository } from '../repositories/account.repository';

/** Types d'événements de sécurité journalisés (FSPEC.18 §15). Extensible sans migration. */
export const SECURITY_EVENTS = {
  ACCOUNT_CREATED: 'account.created',
  EMAIL_VERIFIED: 'account.email_verified',
  EMAIL_VERIFICATION_SENT: 'account.email_verification_sent',
  LOGIN_SUCCEEDED: 'auth.login_succeeded',
  LOGIN_FAILED: 'auth.login_failed',
  PASSWORD_CHANGED: 'account.password_changed',
  PASSWORD_RESET_REQUESTED: 'account.password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'account.password_reset_completed',
  EMAIL_CHANGE_REQUESTED: 'account.email_change_requested',
  EMAIL_CHANGED: 'account.email_changed',
  ACCOUNT_SUSPENDED: 'account.suspended',
  ACCOUNT_REACTIVATED: 'account.reactivated',
  ACCOUNT_DELETED: 'account.deleted',
  DATA_EXPORTED: 'account.data_exported',
  TERMS_ACCEPTED: 'account.terms_accepted',
  MFA_ENABLED: 'account.mfa_enabled',
  MFA_DISABLED: 'account.mfa_disabled',
  MFA_RECOVERY_USED: 'account.mfa_recovery_used',
} as const;

export type SecurityEventType = (typeof SECURITY_EVENTS)[keyof typeof SECURITY_EVENTS];

/**
 * Journal d'audit des opérations de sécurité (IAM-009). **Best-effort** : l'audit ne doit jamais
 * faire échouer l'opération auditée (une panne d'audit est journalisée applicativement). Les
 * métadonnées ne contiennent jamais de secret (ni mot de passe, ni jeton en clair).
 */
@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private readonly repository: AccountRepository) {}

  async record(
    // Clés de sécurité connues (autocomplétées) + types d'audit propres à d'autres domaines
    // (ex. organisations — ORG-009). Le journal `security_events` reste un audit générique.
    type: SecurityEventType | (string & {}),
    userId: string | null,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.repository.recordSecurityEvent(type, userId, metadata);
    } catch (error) {
      this.logger.error(`Audit sécurité « ${type} » non journalisé`, error as Error);
    }
  }
}

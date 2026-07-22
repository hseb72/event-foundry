import { createHash, randomBytes } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountTokenType, type User } from '@prisma/client';
import { InvalidAccountTokenException } from '../exceptions/invalid-account-token.exception';
import { AccountRepository } from '../repositories/account.repository';
import { SECURITY_EVENTS, SecurityAuditService } from './security-audit.service';

/** Durée de validité d'un lien de vérification d'e-mail (FSPEC.18 §5). */
const EMAIL_VERIFICATION_TTL_HOURS = 48;

/**
 * Cycle de vie du compte (FSPEC.18) : vérification de l'adresse e-mail (IAM-003/004) via jetons à
 * usage unique et à durée limitée (IAM-005). Le jeton en clair n'est **jamais** persisté : seule son
 * empreinte SHA-256 l'est ; l'envoi passe par le canal e-mail (stub loggué en dev). Chaque étape est
 * auditée (IAM-009).
 */
@Injectable()
export class AccountLifecycleService {
  private readonly logger = new Logger(AccountLifecycleService.name);

  constructor(
    private readonly repository: AccountRepository,
    private readonly audit: SecurityAuditService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Émet (ou ré-émet) le lien de vérification d'e-mail d'un compte. Invalide les liens précédents
   * (un seul lien valide à la fois). Best-effort côté appelant : une panne d'envoi n'empêche pas
   * l'inscription (le lien peut être redemandé).
   */
  async issueEmailVerification(user: Pick<User, 'id' | 'email'>): Promise<void> {
    await this.repository.invalidateTokens(user.id, AccountTokenType.EMAIL_VERIFICATION);
    const raw = this.generateToken();
    await this.repository.createToken({
      userId: user.id,
      type: AccountTokenType.EMAIL_VERIFICATION,
      tokenHash: this.hash(raw),
      expiresAt: this.expiry(EMAIL_VERIFICATION_TTL_HOURS),
    });
    this.deliverLink(user.email, 'verify-email', raw);
    await this.audit.record(SECURITY_EVENTS.EMAIL_VERIFICATION_SENT, user.id);
  }

  /** Valide l'adresse e-mail à partir du jeton reçu : REGISTERED → ACTIVE (IAM-003). */
  async verifyEmail(rawToken: string): Promise<void> {
    const token = await this.repository.findValidToken(
      this.hash(rawToken),
      AccountTokenType.EMAIL_VERIFICATION,
    );
    if (!token || (await this.repository.consumeToken(token.id)) === 0) {
      throw new InvalidAccountTokenException();
    }
    await this.repository.markEmailVerified(token.userId);
    await this.audit.record(SECURITY_EVENTS.EMAIL_VERIFIED, token.userId);
  }

  /**
   * Redemande un lien de vérification. Réponse **toujours silencieuse** (pas d'énumération de
   * comptes) : compte inconnu ou déjà vérifié → aucun effet.
   */
  async resendVerification(email: string): Promise<void> {
    const user = await this.repository.findUserByEmail(email);
    if (!user || user.emailVerifiedAt || !user.isActive) {
      return;
    }
    await this.issueEmailVerification(user);
  }

  /** Jeton opaque URL-safe (256 bits). Jamais persisté en clair. */
  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private expiry(hours: number): Date {
    return new Date(Date.now() + hours * 3600 * 1000);
  }

  /**
   * Remise du lien au destinataire. Aucun SMTP en dev : le lien est journalisé (même principe que
   * le canal e-mail des notifications). Une implémentation réelle branchera le serveur de
   * messagerie configuré par l'Operator (FSPEC.17), sans changer ce service.
   */
  private deliverLink(email: string, path: string, rawToken: string): void {
    const base = this.config.get<string>('FRONTEND_BASE_URL', 'http://localhost:4200');
    this.logger.log(`[email→${email}] ${base}/${path}?token=${rawToken}`);
  }
}

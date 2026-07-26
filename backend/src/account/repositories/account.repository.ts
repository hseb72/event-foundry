import { Injectable } from '@nestjs/common';
import { AccountTokenType, Prisma, type AccountToken, type User } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface CreateAccountTokenInput {
  userId: string;
  type: AccountTokenType;
  tokenHash: string;
  expiresAt: Date;
  payload?: Record<string, unknown>;
}

/**
 * Persistance du cycle de vie des comptes (FSPEC.18) : jetons à usage unique (empreintes seulement —
 * IAM-005), transitions de statut et journal de sécurité (IAM-009). Seul point d'accès PostgreSQL
 * du module Account (Prisma confiné — ADR.02).
 */
@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  createToken(input: CreateAccountTokenInput): Promise<AccountToken> {
    return this.prisma.accountToken.create({
      data: {
        userId: input.userId,
        type: input.type,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        payload: (input.payload ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /** Jeton valide (non utilisé, non expiré) correspondant à une empreinte, ou null. */
  findValidToken(tokenHash: string, type: AccountTokenType): Promise<AccountToken | null> {
    return this.prisma.accountToken.findFirst({
      where: { tokenHash, type, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  /** Consomme un jeton (usage unique — IAM-005). Renvoie le nb marqué (0 si déjà consommé). */
  async consumeToken(id: string): Promise<number> {
    const result = await this.prisma.accountToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count;
  }

  /** Invalide tous les jetons en cours d'un type pour un utilisateur (ex. AC-IAM-006, ré-émission). */
  async invalidateTokens(userId: string, type: AccountTokenType): Promise<void> {
    await this.prisma.accountToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /** Acceptation des conditions d'utilisation (étape d'onboarding — FSPEC.16/17). Idempotent. */
  acceptTerms(userId: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { termsAcceptedAt: new Date() } });
  }

  /** Marque l'e-mail vérifié et active le compte (IAM-003) — transition REGISTERED → ACTIVE. */
  markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
    });
  }

  /** Remplace le mot de passe (déjà haché). */
  updatePassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  /**
   * Remplace l'adresse e-mail après confirmation (IAM-004) : la nouvelle adresse arrive vérifiée
   * (le lien a été reçu dessus). L'ancienne adresse cesse d'être valide à cet instant précis.
   */
  replaceEmail(userId: string, email: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { email, emailVerifiedAt: new Date() },
    });
  }

  /** Un compte (actif ou non) utilise-t-il déjà cette adresse ? (IAM-002, hors compte donné). */
  async emailInUse(email: string, excludeUserId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email, ...(excludeUserId ? { id: { not: excludeUserId } } : {}) },
    });
    return count > 0;
  }

  /**
   * Rassemble les données personnelles d'un utilisateur pour l'export RGPD (droit de consultation —
   * IAM-010). Inclut le profil, les préférences, les appartenances et le détail des participations,
   * suivis et notifications. Aucune donnée d'un autre utilisateur n'est exposée.
   */
  async gatherPersonalData(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        emailVerifiedAt: true,
        preferences: true,
        createdAt: true,
        roles: { select: { role: { select: { name: true } } } },
        memberships: { select: { organization: { select: { name: true } }, createdAt: true } },
        participations: {
          select: { eventId: true, interested: true, reservationStatus: true, paymentStatus: true },
        },
        follows: { select: { targetType: true, targetId: true, createdAt: true } },
        notifications: { select: { type: true, title: true, createdAt: true }, take: 500 },
      },
    });
  }

  /**
   * Suppression RGPD par **anonymisation** (IAM-007) : la ligne utilisateur est conservée pour ne
   * pas casser l'intégrité (événements créés, audit) mais toutes les données personnelles sont
   * effacées. Les satellites purement personnels (jetons, notifications, suivis, participations,
   * retours de recommandation) sont supprimés. Le journal de sécurité est conservé (audit). En
   * transaction pour une bascule atomique.
   */
  async anonymizeAccount(userId: string, anonymizedEmail: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.accountToken.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.follow.deleteMany({ where: { userId } }),
      this.prisma.userParticipation.deleteMany({ where: { userId } }),
      this.prisma.recommendationFeedback.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          displayName: 'Utilisateur supprimé',
          passwordHash: '',
          status: 'DELETED',
          isActive: false,
          emailVerifiedAt: null,
          preferences: Prisma.DbNull,
          activeExperience: null,
          activeOrganizationId: null,
        },
      }),
    ]);
  }

  /** Journal d'audit sécurité (IAM-009). L'audit survit à la suppression du compte (SetNull). */
  async recordSecurityEvent(
    type: string,
    userId: string | null,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.securityEvent.create({
      data: { type, userId, metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined },
    });
  }

  /** Journal de sécurité d'un utilisateur (consultation par les utilisateurs autorisés). */
  listSecurityEvents(userId: string, limit = 100) {
    return this.prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
  }
}

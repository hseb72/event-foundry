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

  /** Marque l'e-mail vérifié et active le compte (IAM-003) — transition REGISTERED → ACTIVE. */
  markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date(), status: 'ACTIVE' },
    });
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

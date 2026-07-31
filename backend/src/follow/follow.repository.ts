import { Injectable } from '@nestjs/common';
import type { Follow, FollowTargetType } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';

/** Accès PostgreSQL aux suivis (Prisma confiné au Repository — ADR.02). */
@Injectable()
export class FollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Suivre (idempotent) : crée le suivi ou **réactive** un suivi précédemment supprimé
   * (deletedAt → null). Unicité garantie par (userId, targetType, targetId).
   */
  upsertActive(userId: string, targetType: FollowTargetType, targetId: string): Promise<Follow> {
    return this.prisma.follow.upsert({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
      update: { deletedAt: null },
      create: { userId, targetType, targetId },
    });
  }

  /** Ne plus suivre : suppression logique du suivi actif (idempotent). */
  async softDelete(userId: string, targetType: FollowTargetType, targetId: string): Promise<void> {
    await this.prisma.follow.updateMany({
      where: { userId, targetType, targetId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  /** Active/coupe les notifications d'un suivi actif ; retourne le suivi mis à jour (ou null). */
  async setNotify(
    userId: string,
    targetType: FollowTargetType,
    targetId: string,
    notify: boolean,
  ): Promise<Follow | null> {
    const result = await this.prisma.follow.updateMany({
      where: { userId, targetType, targetId, deletedAt: null },
      data: { notify },
    });
    if (result.count === 0) {
      return null;
    }
    return this.prisma.follow.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
    });
  }

  /** Mes suivis actifs. */
  listActiveByUser(userId: string): Promise<Follow[]> {
    return this.prisma.follow.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Abonnés actifs d'un objet (pour les notifications « information Explorer » — ADR.17). Filtre
   * sur `notify = true`. Retourne les identifiants utilisateurs.
   */
  async listFollowerIds(targetType: FollowTargetType, targetId: string): Promise<string[]> {
    const rows = await this.prisma.follow.findMany({
      where: { targetType, targetId, deletedAt: null, notify: true },
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }
}

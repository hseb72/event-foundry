import { Injectable } from '@nestjs/common';
import type { Follow, FollowTargetType } from '@prisma/client';
import { FollowRepository } from './follow.repository';

/**
 * Domaine Follow (ADR.19 / FSPEC.06) : suivis durables utilisateur → objet. Entité indépendante
 * (jamais une préférence) ; alimente découverte, recommandations et notifications. Suivre est
 * idempotent (réactive un suivi supprimé) ; ne plus suivre est une suppression logique.
 */
@Injectable()
export class FollowService {
  constructor(private readonly repository: FollowRepository) {}

  follow(userId: string, targetType: FollowTargetType, targetId: string): Promise<Follow> {
    return this.repository.upsertActive(userId, targetType, targetId);
  }

  unfollow(userId: string, targetType: FollowTargetType, targetId: string): Promise<void> {
    return this.repository.softDelete(userId, targetType, targetId);
  }

  listByUser(userId: string): Promise<Follow[]> {
    return this.repository.listActiveByUser(userId);
  }

  /** Abonnés à notifier lors d'une publication liée à l'objet (consommé par le domaine Notifications). */
  listFollowerIds(targetType: FollowTargetType, targetId: string): Promise<string[]> {
    return this.repository.listFollowerIds(targetType, targetId);
  }
}

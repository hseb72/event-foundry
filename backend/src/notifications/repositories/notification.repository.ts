import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  Prisma,
  type Notification,
} from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  DEFAULT_USER_PREFERENCES,
  type FrequencyTrack,
  type NotificationUserPreferences,
  type VectorChoice,
} from '../domain/notification-routing';

/** Pistes de récap et colonne d'idempotence associée (une par piste — RG-NOTIF-05). */
export type DigestTrack = 'daily' | 'weekly';
const DIGEST_COLUMN: Record<DigestTrack, 'dailyDigestedAt' | 'weeklyDigestedAt'> = {
  daily: 'dailyDigestedAt',
  weekly: 'weeklyDigestedAt',
};

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  eventId?: string | null;
  channel?: NotificationChannel;
  priority?: NotificationPriority;
  /** Marque la notification comme déjà consommée par les récaps (ex. critique diffusée immédiatement). */
  digestConsumed?: boolean;
}

/**
 * Persistance des notifications internes (in-app) et accès aux destinataires (participants d'un
 * Event). Le domaine Notifications ne possède ni les événements ni les participations : il les lit
 * pour router ses messages. Seul point d'accès PostgreSQL (Prisma confiné — ADR.02).
 */
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateNotificationInput): Promise<Notification> {
    const consumedAt = input.digestConsumed ? new Date() : null;
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        eventId: input.eventId ?? null,
        channel: input.channel ?? NotificationChannel.IN_APP,
        priority: input.priority ?? NotificationPriority.INFORMATION,
        dailyDigestedAt: consumedAt,
        weeklyDigestedAt: consumedAt,
      },
    });
  }

  listForUser(userId: string, status?: NotificationStatus): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }

  /** Marque une notification comme lue (idempotent, bornée au propriétaire). Renvoie le nb modifié. */
  async markRead(userId: string, id: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId, status: NotificationStatus.UNREAD },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
    return result.count;
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, status: NotificationStatus.UNREAD },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async remove(userId: string, id: string): Promise<number> {
    const result = await this.prisma.notification.deleteMany({ where: { id, userId } });
    return result.count;
  }

  async exists(userId: string, id: string): Promise<boolean> {
    return (await this.prisma.notification.count({ where: { id, userId } })) > 0;
  }

  /** Identifiants des participants d'un Event (destinataires), en excluant éventuellement l'acteur. */
  async findParticipantIds(eventId: string, excludeUserId?: string): Promise<string[]> {
    const rows = await this.prisma.userParticipation.findMany({
      where: { eventId, ...(excludeUserId ? { userId: { not: excludeUserId } } : {}) },
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }

  /** Titre d'un Event, pour composer le message (contexte, jamais copie de donnée métier). */
  async eventTitle(eventId: string): Promise<string | null> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId }, select: { title: true } });
    return event?.title ?? null;
  }

  /**
   * Notifications en attente de récap pour une piste (planificateur — TSPEC.04). Une notification est
   * « en attente » tant qu'elle n'a pas été datée sur la colonne de la piste. Les récaps déjà émis
   * (`DIGEST_*`) sont exclus pour ne pas s'auto-agréger. Ordonné par destinataire pour l'agrégation.
   */
  findPendingForDigest(track: DigestTrack, limit = 5000): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { [DIGEST_COLUMN[track]]: null, NOT: { type: { startsWith: 'DIGEST_' } } },
      orderBy: [{ userId: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });
  }

  /** Marque des notifications comme incluses dans le récap d'une piste (idempotence — pas de double envoi). */
  async markDigested(track: DigestTrack, ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { [DIGEST_COLUMN[track]]: new Date() },
    });
  }

  /**
   * Identifiants des utilisateurs actifs disposant d'une permission (via leurs rôles plateforme).
   * Sert à cibler les notifications **techniques** (workflow → Operator, ex. import à valider).
   */
  async findUserIdsWithPermission(permissionKey: string): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        roles: { some: { role: { permissions: { some: { permission: { key: permissionKey } } } } } },
      },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  /**
   * Préférences de notifications V3 (JSONB `preferences.notifications`) : un vecteur par piste de
   * fréquence. Rétro-compatible avec l'ancien format `{ email, push }` (mappé sur la piste immédiate)
   * et repli sur les valeurs par défaut (in-app + récap hebdo email).
   */
  async getUserPreferences(userId: string): Promise<NotificationUserPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const raw = (user?.preferences as { notifications?: unknown } | null)?.notifications;
    return normalizeUserPreferences(raw);
  }

  /** Écrit les préférences de notifications en fusionnant dans `preferences` (sans écraser le reste). */
  async setUserPreferences(
    userId: string,
    preferences: NotificationUserPreferences,
  ): Promise<NotificationUserPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const current = (user?.preferences as Record<string, unknown> | null) ?? {};
    await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: { ...current, notifications: preferences } as Prisma.InputJsonValue },
    });
    return preferences;
  }
}

/** Normalise une valeur brute de préférences vers le modèle V3 (avec rétro-compat + défauts). */
function normalizeUserPreferences(raw: unknown): NotificationUserPreferences {
  if (raw && typeof raw === 'object') {
    const value = raw as Record<string, unknown>;
    // Ancien format { email, push } → piste immédiate.
    if ('email' in value || 'push' in value) {
      const immediate: VectorChoice = value['email'] === true ? 'email' : value['push'] === true ? 'push' : 'none';
      return { ...DEFAULT_USER_PREFERENCES, immediate };
    }
    const track = (key: FrequencyTrack): VectorChoice => {
      const v = value[key];
      return v === 'email' || v === 'push' || v === 'none' ? v : DEFAULT_USER_PREFERENCES[key];
    };
    return { immediate: track('immediate'), daily: track('daily'), weekly: track('weekly') };
  }
  return { ...DEFAULT_USER_PREFERENCES };
}

import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationStatus, type Notification } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  eventId?: string | null;
  channel?: NotificationChannel;
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
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        eventId: input.eventId ?? null,
        channel: input.channel ?? NotificationChannel.IN_APP,
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

  /** Préférences de notifications de l'utilisateur (JSONB `preferences.notifications`). */
  async notificationPreferences(userId: string): Promise<{ email: boolean; push: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
    const prefs = (user?.preferences as { notifications?: { email?: boolean; push?: boolean } } | null)?.notifications;
    return { email: prefs?.email === true, push: prefs?.push === true };
  }
}

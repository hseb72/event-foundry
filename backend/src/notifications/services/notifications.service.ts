import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationStatus, type Notification } from '@prisma/client';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationDispatcher } from './notification-dispatcher.service';

/** Types de notifications produits à partir des transitions d'un Event (EPIC 08). */
export type EventNotificationType =
  | 'EVENT_UPDATED'
  | 'EVENT_UNPUBLISHED'
  | 'EVENT_ARCHIVED'
  | 'EVENT_REPUBLISHED';

const MESSAGES: Record<EventNotificationType, { title: string; body: (event: string) => string }> = {
  EVENT_UPDATED: { title: 'Événement modifié', body: (e) => `« ${e} » de votre planning a été mis à jour.` },
  EVENT_UNPUBLISHED: { title: 'Événement retiré', body: (e) => `« ${e} » a été retiré de la diffusion.` },
  EVENT_ARCHIVED: { title: 'Événement archivé', body: (e) => `« ${e} » a été archivé par l'organisateur.` },
  EVENT_REPUBLISHED: { title: 'Événement de nouveau disponible', body: (e) => `« ${e} » est de nouveau publié.` },
};

/**
 * Domaine Notifications (TSPEC.07) : transforme des transitions métier d'un Event en messages
 * destinés à ses participants, diffusés selon leurs préférences (canal interne + email/push). Ne
 * prend aucune décision métier — le domaine émetteur décide de la pertinence. La diffusion ne bloque
 * jamais le producteur (best-effort, erreurs journalisées).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repository: NotificationRepository,
    private readonly dispatcher: NotificationDispatcher,
  ) {}

  /** Notifie les participants d'un Event d'une transition (best-effort ; n'interrompt jamais l'appelant). */
  async notifyEventChange(
    eventId: string,
    type: EventNotificationType,
    actorId?: string,
  ): Promise<void> {
    try {
      const recipients = await this.repository.findParticipantIds(eventId, actorId);
      if (recipients.length === 0) {
        return;
      }
      const title = (await this.repository.eventTitle(eventId)) ?? 'un événement';
      const template = MESSAGES[type];
      for (const userId of recipients) {
        const notification = await this.repository.create({
          userId,
          type,
          title: template.title,
          body: template.body(title),
          eventId,
        });
        const preferences = await this.repository.notificationPreferences(userId);
        await this.dispatcher.dispatch(notification, preferences);
      }
    } catch (error) {
      this.logger.error(`Notification de la transition ${type} sur ${eventId} échouée`, error as Error);
    }
  }

  list(userId: string, status?: NotificationStatus): Promise<Notification[]> {
    return this.repository.listForUser(userId, status);
  }

  unreadCount(userId: string): Promise<number> {
    return this.repository.unreadCount(userId);
  }

  async markRead(userId: string, id: string): Promise<void> {
    if (!(await this.repository.exists(userId, id))) {
      throw new NotFoundException(`Notification introuvable : ${id}.`);
    }
    await this.repository.markRead(userId, id);
  }

  markAllRead(userId: string): Promise<void> {
    return this.repository.markAllRead(userId);
  }

  async remove(userId: string, id: string): Promise<void> {
    if ((await this.repository.remove(userId, id)) === 0) {
      throw new NotFoundException(`Notification introuvable : ${id}.`);
    }
  }
}

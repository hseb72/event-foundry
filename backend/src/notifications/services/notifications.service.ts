import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FollowTargetType, NotificationStatus, type Notification } from '@prisma/client';
import { FollowService } from '../../follow/follow.service';
import type { ChannelPreferences } from '../domain/notification-channel';
import { resolveOutboundVector } from '../domain/notification-routing';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { NotificationSettingsService } from './notification-settings.service';

/** Données minimales d'un événement publié, pour notifier les abonnés (sans coupler au domaine Events). */
export interface PublishedEventTargets {
  id: string;
  title: string;
  organizerId: string | null;
  activityId: string;
  categoryId: string | null;
  venueId: string | null;
}

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
    private readonly follows: FollowService,
    private readonly settings: NotificationSettingsService,
  ) {}

  /**
   * Vecteurs sortants effectifs pour une notification **immédiate** (Channel Router — RG-NOTIF-03) :
   * croise réglages globaux (Operator) et préférences individuelles. L'in-app est toujours conservé
   * séparément (historique). Les récaps (quotidien/hebdo) relèveront du planificateur (04-C).
   */
  private async resolveOutbound(userId: string): Promise<ChannelPreferences> {
    const [settings, preferences] = await Promise.all([
      this.settings.get(),
      this.repository.getUserPreferences(userId),
    ]);
    const vector = resolveOutboundVector('immediate', preferences, settings);
    return { email: vector === 'email', push: vector === 'push' };
  }

  /**
   * Notification « information Explorer » (ADR.17 / FSPEC.04) : à la **première publication** d'un
   * événement, informe les abonnés (Follow — ADR.19) de son organisateur / activité / catégorie /
   * lieu. Best-effort ; n'interrompt jamais la publication. L'auteur de la publication est exclu.
   */
  async notifyFollowersOfNewEvent(event: PublishedEventTargets, actorId?: string): Promise<void> {
    try {
      const targets: [FollowTargetType, string | null][] = [
        [FollowTargetType.ORGANIZER, event.organizerId],
        [FollowTargetType.ACTIVITY, event.activityId],
        [FollowTargetType.CATEGORY, event.categoryId],
        [FollowTargetType.VENUE, event.venueId],
      ];
      const recipients = new Set<string>();
      for (const [type, targetId] of targets) {
        if (!targetId) {
          continue;
        }
        for (const userId of await this.follows.listFollowerIds(type, targetId)) {
          recipients.add(userId);
        }
      }
      if (actorId) {
        recipients.delete(actorId);
      }
      for (const userId of recipients) {
        const notification = await this.repository.create({
          userId,
          type: 'NEW_FOLLOWED_EVENT',
          title: 'Nouvel événement suivi',
          body: `« ${event.title} » vient d'être publié.`,
          eventId: event.id,
        });
        await this.dispatcher.dispatch(notification, await this.resolveOutbound(userId));
      }
    } catch (error) {
      this.logger.error(`Notification des abonnés du nouvel événement ${event.id} échouée`, error as Error);
    }
  }

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
        await this.dispatcher.dispatch(notification, await this.resolveOutbound(userId));
      }
    } catch (error) {
      this.logger.error(`Notification de la transition ${type} sur ${eventId} échouée`, error as Error);
    }
  }

  /**
   * Notification **technique** (famille workflow — FSPEC.04) : un import a produit des candidats à
   * valider → informe les opérateurs du pipeline (`pipeline.manage`). Politique déterministe : rien à
   * notifier si aucun candidat n'a été créé. Best-effort ; n'interrompt jamais le pipeline.
   */
  async notifyImportReadyForValidation(importJobId: string, createdCount: number): Promise<void> {
    if (createdCount <= 0) {
      return;
    }
    try {
      const recipients = await this.repository.findUserIdsWithPermission('pipeline.manage');
      for (const userId of recipients) {
        const notification = await this.repository.create({
          userId,
          type: 'IMPORT_READY_FOR_VALIDATION',
          title: 'Import prêt à valider',
          body: `Un import a produit ${createdCount} candidat(s) à valider.`,
          eventId: null,
        });
        await this.dispatcher.dispatch(notification, await this.resolveOutbound(userId));
      }
    } catch (error) {
      this.logger.error(`Notification « import prêt à valider » (${importJobId}) échouée`, error as Error);
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

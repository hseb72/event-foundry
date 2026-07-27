import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FollowTargetType, NotificationPriority, NotificationStatus, type Notification } from '@prisma/client';
import { FollowService } from '../../follow/follow.service';
import { resolveImmediateVector, type NotificationPriorityLevel } from '../domain/notification-routing';
import { NotificationRepository } from '../repositories/notification.repository';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { NotificationSettingsService } from './notification-settings.service';

/** Correspondance enum Prisma → niveau de priorité du domaine de routage (RG-NOTIF-05). */
const PRIORITY_LEVEL: Record<NotificationPriority, NotificationPriorityLevel> = {
  INFORMATION: 'information',
  IMPORTANT: 'important',
  CRITICAL: 'critical',
};

/** Contenu d'une notification à émettre (l'in-app est toujours créé ; l'envoi sortant suit le routage). */
interface NotificationDraft {
  type: string;
  title: string;
  body: string;
  eventId?: string | null;
  priority?: NotificationPriority;
}

/** Données minimales d'un événement publié, pour notifier les abonnés (sans coupler au domaine Events). */
export interface PublishedEventTargets {
  id: string;
  title: string;
  organizerId: string | null;
  activityId: string;
  categoryIds: string[];
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
   * Crée l'in-app (historique — toujours) puis applique le **routage immédiat** priorité comprise
   * (Channel Router — RG-NOTIF-03/05). Une notification `critical` est diffusée immédiatement et
   * **consommée** des récaps (pas de doublon) ; les autres restent éligibles au planificateur de
   * récaps selon les pistes actives de l'utilisateur.
   */
  private async emit(userId: string, draft: NotificationDraft): Promise<void> {
    const priority = draft.priority ?? NotificationPriority.INFORMATION;
    const [settings, preferences] = await Promise.all([
      this.settings.get(),
      this.repository.getUserPreferences(userId),
    ]);
    const vector = resolveImmediateVector(PRIORITY_LEVEL[priority], preferences, settings);
    const notification = await this.repository.create({
      userId,
      type: draft.type,
      title: draft.title,
      body: draft.body,
      eventId: draft.eventId ?? null,
      priority,
      digestConsumed: priority === NotificationPriority.CRITICAL,
    });
    if (vector) {
      await this.dispatcher.dispatch(notification, { email: vector === 'email', push: vector === 'push' });
    }
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
        // Catégories transverses (DATA.01 §5) : un abonné à l'une d'elles est notifié.
        ...event.categoryIds.map(
          (categoryId): [FollowTargetType, string | null] => [FollowTargetType.CATEGORY, categoryId],
        ),
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
        await this.emit(userId, {
          type: 'NEW_FOLLOWED_EVENT',
          title: 'Nouvel événement suivi',
          body: `« ${event.title} » vient d'être publié.`,
          eventId: event.id,
        });
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
        await this.emit(userId, {
          type,
          title: template.title,
          body: template.body(title),
          eventId,
        });
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
        await this.emit(userId, {
          type: 'IMPORT_READY_FOR_VALIDATION',
          title: 'Import prêt à valider',
          body: `Un import a produit ${createdCount} candidat(s) à valider.`,
          priority: NotificationPriority.IMPORTANT,
        });
      }
    } catch (error) {
      this.logger.error(`Notification « import prêt à valider » (${importJobId}) échouée`, error as Error);
    }
  }

  /**
   * Notification **technique** (FSPEC.21 §19) : une nouvelle Case est ouverte → informe les Operators
   * habilités (`case.manage`). Best-effort. (Un ciblage par file/domaine affinera plus tard.)
   */
  async notifyOperatorsNewCase(reference: string, subject: string): Promise<void> {
    try {
      const recipients = await this.repository.findUserIdsWithPermission('case.manage');
      for (const userId of recipients) {
        await this.emit(userId, {
          type: 'CASE_OPENED',
          title: 'Nouveau dossier à traiter',
          body: `${reference} — ${subject}`,
          priority: NotificationPriority.INFORMATION,
        });
      }
    } catch (error) {
      this.logger.error(`Notification « nouveau dossier » (${reference}) échouée`, error as Error);
    }
  }

  /** Notification à l'Operator affecté à une Case (FSPEC.21 §19). Best-effort. */
  async notifyCaseAssigned(assigneeId: string, reference: string, subject: string): Promise<void> {
    try {
      await this.emit(assigneeId, {
        type: 'CASE_ASSIGNED',
        title: 'Dossier qui vous est affecté',
        body: `${reference} — ${subject}`,
        priority: NotificationPriority.IMPORTANT,
      });
    } catch (error) {
      this.logger.error(`Notification « dossier affecté » (${reference}) échouée`, error as Error);
    }
  }

  /**
   * Informe le demandeur d'une évolution de sa Case qui le concerne (§19). Pour les états d'attente,
   * le motif de l'Operator (`message`) est joint : il indique quels éléments apporter. Best-effort.
   */
  async notifyRequesterCaseUpdate(
    requesterId: string,
    reference: string,
    status: string,
    message?: string | null,
  ): Promise<void> {
    const messages: Record<string, string> = {
      WAITING_FOR_USER: 'Votre demande attend une information de votre part.',
      WAITING_FOR_ORGANIZER: 'Votre demande attend une information de votre organisation.',
      RESOLVED: 'Votre demande a été résolue.',
      CLOSED: 'Votre demande a été clôturée.',
    };
    const base = messages[status];
    if (!base) {
      return;
    }
    // Le motif de l'Operator précise ce qui est attendu ; le demandeur peut répondre pour l'apporter.
    const body = message?.trim() ? `${base}\n\n« ${message.trim()} »` : base;
    try {
      await this.emit(requesterId, { type: `CASE_${status}`, title: `Demande ${reference}`, body });
    } catch (error) {
      this.logger.error(`Notification « demande mise à jour » (${reference}) échouée`, error as Error);
    }
  }

  /**
   * Notification **information** (FSPEC.22 §16) : un Explorer signale à une organisation qu'un
   * événement privé mentionnant sa fiche organisateur existe. Purement informatif — ne transfère
   * jamais la propriété (ESUB-011). Best-effort ; retourne le nombre de membres notifiés.
   */
  async notifyOrganizationOfPrivateEvent(
    memberIds: string[],
    eventTitle: string,
  ): Promise<number> {
    let notified = 0;
    for (const userId of memberIds) {
      try {
        await this.emit(userId, {
          type: 'PRIVATE_EVENT_MENTIONS_ORGANIZER',
          title: 'Un événement vous mentionne',
          body: `Un utilisateur a enregistré « ${eventTitle} » comme événement privé vous concernant. ` +
            'Vous pouvez publier votre propre version officielle.',
          priority: NotificationPriority.INFORMATION,
        });
        notified += 1;
      } catch (error) {
        this.logger.error(`Notification « événement privé mentionne l'organisation » échouée (user ${userId})`, error as Error);
      }
    }
    return notified;
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

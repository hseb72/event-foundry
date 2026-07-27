import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { EventVisibility } from '@prisma/client';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { EventsService } from './events.service';

export interface OrganizerNotifyResult {
  notified: number;
  organizationName: string;
}

/**
 * Notification d'un Organizer enregistré (FSPEC.22 §16). Depuis un **événement privé**, son créateur
 * peut informer l'organisation qui déclare représenter la fiche Organizer mentionnée qu'un événement
 * la concernant existe déjà. Action **purement informative** : elle ne publie rien et ne transfère
 * jamais la propriété de l'événement privé (ESUB-011).
 */
@Injectable()
export class OrganizerNotifyService {
  private readonly logger = new Logger(OrganizerNotifyService.name);

  constructor(
    private readonly events: EventsService,
    private readonly organizations: OrganizationsService,
    private readonly notifications: NotificationsService,
  ) {}

  /** L'organisation notifiable pour un événement, ou null (fiche Organizer sans compte lié). */
  async notifiableOrganization(
    organizerId: string | null,
  ): Promise<{ id: string; name: string } | null> {
    if (!organizerId) {
      return null;
    }
    return this.organizations.linkedOrganization(organizerId);
  }

  /**
   * Notifie l'organisation liée à la fiche Organizer de l'événement privé. Réservé au créateur (la
   * lecture applique déjà la garde de visibilité). Refuse si l'événement n'est pas privé, ne mentionne
   * pas d'organisateur, ou si aucune organisation n'est enregistrée pour cette fiche.
   */
  async notify(eventId: string, userId: string): Promise<OrganizerNotifyResult> {
    const event = await this.events.getForReader(eventId, userId);
    if (event.visibility !== EventVisibility.PRIVATE) {
      throw new BadRequestException("Seul un événement privé peut notifier un organisateur.");
    }
    if (!event.organizerId) {
      throw new BadRequestException("Cet événement ne mentionne aucun organisateur.");
    }
    const org = await this.organizations.linkedOrganization(event.organizerId);
    if (!org) {
      throw new ConflictException(
        "L'organisateur mentionné n'est pas enregistré sur la plateforme : aucune notification possible.",
      );
    }
    const memberIds = (await this.organizations.memberIds(org.id)).filter((id) => id !== userId);
    const notified = await this.notifications.notifyOrganizationOfPrivateEvent(memberIds, event.title);
    this.logger.log(
      `OrganizerNotified event=${eventId} organization=${org.id} recipients=${notified} (informational, §16)`,
    );
    return { notified, organizationName: org.name };
  }
}

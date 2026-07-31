import { Injectable, Logger } from '@nestjs/common';
import { NotificationPriority, type Notification } from '@prisma/client';
import { resolveOutboundVector } from '../domain/notification-routing';
import { NotificationRepository, type DigestTrack } from '../repositories/notification.repository';
import { NotificationDispatcher } from './notification-dispatcher.service';
import { NotificationSettingsService } from './notification-settings.service';

/** Bilan d'un passage du planificateur (observabilité). */
export interface DigestRunStats {
  track: DigestTrack;
  recipients: number;
  delivered: number;
  notifications: number;
}

const LABELS: Record<DigestTrack, { type: string; title: string }> = {
  daily: { type: 'DIGEST_DAILY', title: 'Récap quotidien' },
  weekly: { type: 'DIGEST_WEEKLY', title: 'Récap hebdomadaire' },
};

/**
 * Planificateur de récaps (FSPEC.04 / TSPEC.04). À chaque passage d'une piste (quotidienne /
 * hebdomadaire), **agrège** les notifications en attente par destinataire, applique le **routage
 * déterministe** de la piste (RG-NOTIF-03), délègue l'envoi au provider retenu, puis marque les
 * notifications « diffusées » pour la piste (**idempotence** — pas de double envoi, RG-NOTIF-05).
 *
 * L'immédiat est traité au fil de l'eau (hors planificateur) ; les notifications `critical` ont déjà
 * été consommées à l'émission et n'apparaissent donc jamais ici. Best-effort : une erreur sur un
 * destinataire n'interrompt pas les autres, et le passage n'échoue jamais bruyamment.
 */
@Injectable()
export class NotificationDigestService {
  private readonly logger = new Logger(NotificationDigestService.name);

  constructor(
    private readonly repository: NotificationRepository,
    private readonly dispatcher: NotificationDispatcher,
    private readonly settings: NotificationSettingsService,
  ) {}

  async runDigest(track: DigestTrack): Promise<DigestRunStats> {
    const stats: DigestRunStats = { track, recipients: 0, delivered: 0, notifications: 0 };
    const pending = await this.repository.findPendingForDigest(track);
    if (pending.length === 0) {
      return stats;
    }
    const settings = await this.settings.get();
    const byUser = new Map<string, Notification[]>();
    for (const notification of pending) {
      const list = byUser.get(notification.userId) ?? [];
      list.push(notification);
      byUser.set(notification.userId, list);
    }
    stats.recipients = byUser.size;
    stats.notifications = pending.length;

    for (const [userId, items] of byUser) {
      try {
        const preferences = await this.repository.getUserPreferences(userId);
        const vector = resolveOutboundVector(track, preferences, settings);
        // Vecteur actif → on agrège et on diffuse ; sinon la piste est simplement consommée (l'in-app
        // reste l'historique). Dans les deux cas on marque pour ne pas ré-agréger indéfiniment.
        if (vector) {
          const digest = await this.repository.create({
            userId,
            type: LABELS[track].type,
            title: LABELS[track].title,
            body: this.summarize(items),
            priority: NotificationPriority.INFORMATION,
            digestConsumed: true,
          });
          await this.dispatcher.dispatch(digest, { email: vector === 'email', push: vector === 'push' });
          stats.delivered += 1;
        }
        await this.repository.markDigested(track, items.map((item) => item.id));
      } catch (error) {
        this.logger.error(`Récap ${track} échoué pour le destinataire ${userId}`, error as Error);
      }
    }
    this.logger.log(
      `Récap ${track} : ${stats.delivered}/${stats.recipients} destinataire(s) servi(s) — ${stats.notifications} notification(s) agrégée(s).`,
    );
    return stats;
  }

  /** Message de synthèse d'un récap (regroupement — ADR.17). Reste factuel, sans donnée métier copiée. */
  private summarize(items: Notification[]): string {
    const count = items.length;
    return count === 1
      ? '1 nouvelle notification depuis votre dernier récap.'
      : `${count} nouvelles notifications depuis votre dernier récap.`;
  }
}

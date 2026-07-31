import { Logger } from '@nestjs/common';
import type { Notification } from '@prisma/client';
import type { ChannelPreferences, NotificationChannelHandler } from './notification-channel';

/**
 * Canal e-mail (stub). Aucun fournisseur SMTP n'est disponible dans cet environnement : la
 * diffusion est journalisée (comme MinIO/OCR côté infra). Le contrat reste prêt à recevoir une
 * implémentation réelle sans changer le domaine.
 */
export class EmailChannel implements NotificationChannelHandler {
  readonly name = 'EMAIL';
  private readonly logger = new Logger('EmailChannel');

  enabledFor(preferences: ChannelPreferences): boolean {
    return preferences.email;
  }

  async deliver(notification: Notification): Promise<void> {
    this.logger.log(`[email→${notification.userId}] ${notification.title}`);
  }
}

/** Canal Push (stub) : même principe que l'e-mail, prêt pour un fournisseur réel. */
export class PushChannel implements NotificationChannelHandler {
  readonly name = 'PUSH';
  private readonly logger = new Logger('PushChannel');

  enabledFor(preferences: ChannelPreferences): boolean {
    return preferences.push;
  }

  async deliver(notification: Notification): Promise<void> {
    this.logger.log(`[push→${notification.userId}] ${notification.title}`);
  }
}

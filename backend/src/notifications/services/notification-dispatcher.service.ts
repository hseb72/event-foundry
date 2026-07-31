import { Injectable, Logger } from '@nestjs/common';
import type { Notification } from '@prisma/client';
import { EmailChannel, PushChannel } from '../domain/channels';
import type { ChannelPreferences, NotificationChannelHandler } from '../domain/notification-channel';

/**
 * Diffuse une notification déjà créée (canal interne) vers les canaux complémentaires activés
 * (email, push). Best-effort : les erreurs de diffusion sont journalisées et n'interrompent jamais
 * le traitement (TSPEC.07 — la diffusion est découplée de la production des événements).
 */
@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private readonly channels: NotificationChannelHandler[] = [new EmailChannel(), new PushChannel()];

  async dispatch(notification: Notification, preferences: ChannelPreferences): Promise<void> {
    for (const channel of this.channels) {
      if (!channel.enabledFor(preferences)) {
        continue;
      }
      try {
        await channel.deliver(notification);
      } catch (error) {
        this.logger.error(`Diffusion ${channel.name} échouée pour ${notification.id}`, error as Error);
      }
    }
  }
}

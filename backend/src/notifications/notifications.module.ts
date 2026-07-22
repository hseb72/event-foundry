import { Module } from '@nestjs/common';
import { FollowModule } from '../follow/follow.module';
import { PlatformConfigModule } from '../platform-config/platform-config.module';
import { NotificationSettingsController } from './controllers/notification-settings.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationDispatcher } from './services/notification-dispatcher.service';
import { NotificationEventSubscriber } from './services/notification-event.subscriber';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationSettingsService } from './services/notification-settings.service';
import { NotificationsService } from './services/notifications.service';

/**
 * Domaine Notifications (FSPEC.04 / ADR.17). Transforme des faits métier en messages, et les diffuse
 * selon un **routage déterministe à double niveau** : réglages globaux (Operator) + préférences
 * individuelles (Explorer). Le canal in-app reste toujours actif (historique). Ne dépend d'aucun
 * domaine métier ; `NotificationsService` est exporté pour les producteurs (Publishing…).
 */
@Module({
  imports: [FollowModule, PlatformConfigModule],
  controllers: [NotificationsController, NotificationSettingsController],
  providers: [
    NotificationsService,
    NotificationDispatcher,
    NotificationRepository,
    NotificationSettingsService,
    NotificationPreferencesService,
    NotificationEventSubscriber,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}

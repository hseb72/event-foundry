import { Module } from '@nestjs/common';
import { FollowModule } from '../follow/follow.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationDispatcher } from './services/notification-dispatcher.service';
import { NotificationsService } from './services/notifications.service';

/**
 * Domaine Notifications (TSPEC.07) : transforme des transitions métier en messages destinés aux
 * participants et les diffuse selon leurs préférences (canal interne + email/push stubs). Ne dépend
 * d'aucun domaine métier (lecture seule via son Repository) ; `NotificationsService` est exporté
 * pour que les domaines producteurs (Publishing / Catalog) émettent leurs transitions.
 */
@Module({
  imports: [FollowModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationDispatcher, NotificationRepository],
  exports: [NotificationsService],
})
export class NotificationsModule {}

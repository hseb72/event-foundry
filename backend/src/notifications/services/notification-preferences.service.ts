import { Injectable } from '@nestjs/common';
import type { NotificationUserPreferences } from '../domain/notification-routing';
import { NotificationRepository } from '../repositories/notification.repository';

/**
 * Préférences de notifications individuelles (Explorer — FSPEC.04). Pour chaque piste de fréquence,
 * l'utilisateur choisit un vecteur (email/push) ou « aucun ». L'in-app reste toujours actif
 * (historique) et n'est pas réglable ici.
 */
@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly repository: NotificationRepository) {}

  get(userId: string): Promise<NotificationUserPreferences> {
    return this.repository.getUserPreferences(userId);
  }

  update(userId: string, preferences: NotificationUserPreferences): Promise<NotificationUserPreferences> {
    return this.repository.setUserPreferences(userId, preferences);
  }
}

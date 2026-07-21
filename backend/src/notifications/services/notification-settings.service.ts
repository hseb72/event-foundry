import { Injectable } from '@nestjs/common';
import { Prisma, SecretStatus } from '@prisma/client';
import { PlatformConfigRepository } from '../../platform-config/platform-config.repository';
import {
  DEFAULT_GLOBAL_SETTINGS,
  type NotificationGlobalSettings,
} from '../domain/notification-routing';

const SECTION = 'NOTIFICATIONS';
const KEY = 'settings';

/**
 * Réglages globaux des notifications (Operator — FSPEC.04 §Vecteurs & fréquences). Active/désactive
 * globalement les **vecteurs** (email/push) et les **pistes de fréquence** (immédiate/quotidienne/
 * hebdomadaire). Stockés en PlatformSetting ; repli sur les valeurs par défaut. Le canal **in-app**
 * n'est pas réglable ici : il reste toujours actif (historique).
 */
@Injectable()
export class NotificationSettingsService {
  constructor(private readonly repository: PlatformConfigRepository) {}

  async get(): Promise<NotificationGlobalSettings> {
    const setting = await this.repository.find(SECTION, KEY);
    const value = setting?.value as unknown as Partial<NotificationGlobalSettings> | null;
    return {
      vectors: {
        email: value?.vectors?.email ?? DEFAULT_GLOBAL_SETTINGS.vectors.email,
        push: value?.vectors?.push ?? DEFAULT_GLOBAL_SETTINGS.vectors.push,
      },
      frequencies: {
        immediate: value?.frequencies?.immediate ?? DEFAULT_GLOBAL_SETTINGS.frequencies.immediate,
        daily: value?.frequencies?.daily ?? DEFAULT_GLOBAL_SETTINGS.frequencies.daily,
        weekly: value?.frequencies?.weekly ?? DEFAULT_GLOBAL_SETTINGS.frequencies.weekly,
      },
    };
  }

  async update(settings: NotificationGlobalSettings): Promise<NotificationGlobalSettings> {
    await this.repository.upsert(SECTION, KEY, {
      value: settings as unknown as Prisma.InputJsonValue,
      secretRef: null,
      status: SecretStatus.CONFIGURED,
    });
    return this.get();
  }
}

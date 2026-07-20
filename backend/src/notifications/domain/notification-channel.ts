import type { Notification } from '@prisma/client';

/** Préférences de diffusion effectives d'un destinataire, par canal complémentaire. */
export interface ChannelPreferences {
  email: boolean;
  push: boolean;
}

/**
 * Canal de diffusion complémentaire (email, push). Chaque canal est une implémentation indépendante
 * (TSPEC.07). Le canal interne (in-app) est la notification persistée elle-même ; les canaux ci-après
 * ne font que rediffuser ce message, sans jamais porter de décision métier.
 */
export interface NotificationChannelHandler {
  readonly name: string;
  /** Le canal est-il activé pour ce destinataire (préférences respectées avant diffusion) ? */
  enabledFor(preferences: ChannelPreferences): boolean;
  /** Diffuse la notification. Best-effort : une erreur ne doit jamais bloquer le domaine producteur. */
  deliver(notification: Notification): Promise<void>;
}

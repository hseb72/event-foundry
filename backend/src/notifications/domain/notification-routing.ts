/**
 * Cœur déterministe du routage des notifications (ADR.17 / FSPEC.04). Décide, pour une **piste de
 * fréquence**, le **vecteur sortant** effectif en croisant les **réglages globaux** (Operator) et les
 * **préférences individuelles** (Explorer). Le canal **in-app** est toujours conservé (historique) —
 * il ne fait pas partie de ce calcul, qui ne concerne que les envois sortants (email/push).
 *
 * Règles : RG-NOTIF-03 (double niveau, le plus restrictif gagne) · RG-NOTIF-04 (pistes indépendantes).
 */

/** Vecteurs sortants pris en charge en V3 (in-app est implicite / toujours actif). */
export type OutboundVector = 'email' | 'push';

/** Choix individuel pour une piste : un vecteur sortant, ou aucun. */
export type VectorChoice = OutboundVector | 'none';

/** Pistes de fréquence indépendantes (RG-NOTIF-04). */
export type FrequencyTrack = 'immediate' | 'daily' | 'weekly';

/** Pistes différables (récaps) par ordre de repli pour une notification critique. */
export const DIGEST_TRACKS: readonly FrequencyTrack[] = ['daily', 'weekly'];

/** Priorité d'une notification (ADR.17). Seule `critical` outrepasse les réglages de récap. */
export type NotificationPriorityLevel = 'information' | 'important' | 'critical';

/** Réglages globaux plateforme (Operator) : vecteurs et pistes activés globalement. */
export interface NotificationGlobalSettings {
  vectors: Record<OutboundVector, boolean>;
  frequencies: Record<FrequencyTrack, boolean>;
}

/** Préférences individuelles : pour chaque piste, le vecteur choisi (ou aucun). */
export type NotificationUserPreferences = Record<FrequencyTrack, VectorChoice>;

/** Réglages globaux par défaut : tout est disponible (l'Operator restreint au besoin). */
export const DEFAULT_GLOBAL_SETTINGS: NotificationGlobalSettings = {
  vectors: { email: true, push: true },
  frequencies: { immediate: true, daily: true, weekly: true },
};

/**
 * Préférences par défaut d'un nouvel utilisateur (FSPEC.04 §Réglage par défaut) : in-app (implicite)
 * + **récap hebdomadaire par email** ; immédiat et quotidien = aucun. Choix prudent, modifiable.
 */
export const DEFAULT_USER_PREFERENCES: NotificationUserPreferences = {
  immediate: 'none',
  daily: 'none',
  weekly: 'email',
};

/**
 * Résout le vecteur sortant effectif d'une piste. Le plus restrictif gagne (RG-NOTIF-03) :
 * - la piste doit être activée globalement ;
 * - le vecteur choisi doit être activé globalement ;
 * - « aucun » individuel bloque tout envoi.
 * Renvoie `null` si rien ne doit sortir (seul l'in-app conserve la trace).
 */
export function resolveOutboundVector(
  track: FrequencyTrack,
  preferences: NotificationUserPreferences,
  settings: NotificationGlobalSettings,
): OutboundVector | null {
  if (!settings.frequencies[track]) {
    return null;
  }
  const choice = preferences[track];
  if (choice === 'none') {
    return null;
  }
  return settings.vectors[choice] ? choice : null;
}

/**
 * Vecteur sortant **immédiat** effectif au moment de la réception d'un événement, priorité comprise
 * (RG-NOTIF-05). Une notification `critical` ne peut jamais être différée dans un récap : si la piste
 * immédiate ne donne rien, on se rabat sur le vecteur d'une piste de récap active (quotidienne puis
 * hebdomadaire) pour la diffuser **maintenant**. Pour les autres priorités, seule la piste immédiate
 * compte (les pistes de récap sont traitées par le planificateur). Renvoie `null` si aucun vecteur
 * sortant n'est configuré (l'in-app conserve toujours la trace).
 */
export function resolveImmediateVector(
  priority: NotificationPriorityLevel,
  preferences: NotificationUserPreferences,
  settings: NotificationGlobalSettings,
): OutboundVector | null {
  const immediate = resolveOutboundVector('immediate', preferences, settings);
  if (immediate || priority !== 'critical') {
    return immediate;
  }
  for (const track of DIGEST_TRACKS) {
    const vector = resolveOutboundVector(track, preferences, settings);
    if (vector) {
      return vector;
    }
  }
  return null;
}

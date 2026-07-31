import { Injectable, signal } from '@angular/core';

/** Nature d'un message : elle détermine la couleur, l'icône et la durée d'affichage. */
export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  /** Titre court : ce qui s'est passé (« Événement créé », « Création refusée »). */
  title: string;
  /** Détail facultatif : la raison renvoyée par le serveur, telle quelle. */
  detail?: string;
}

/**
 * Durées d'affichage, en millisecondes. Une erreur reste **deux fois plus longtemps** qu'un succès :
 * elle porte une raison à lire, là où un succès ne fait que confirmer. Elle reste par ailleurs
 * fermable à la main, et l'auto-fermeture est suspendue tant que le pointeur la survole.
 */
const DURATIONS: Record<ToastKind, number> = {
  success: 4000,
  info: 5000,
  error: 10000,
};

/**
 * Notifications éphémères (toasts) : retour visible d'une action, quel que soit l'endroit de la page
 * où l'utilisateur se trouve.
 *
 * Existe parce qu'un message posé en haut d'un formulaire long passe inaperçu — au moment où l'on
 * clique sur « Enregistrer », le haut du formulaire est hors de l'écran. Le toast s'affiche en
 * surimpression, indépendamment du défilement.
 *
 * Ne remplace pas les messages **contextuels** (une erreur de saisie appartient au champ concerné,
 * une soumission retenue pour revue mérite un encadré explicatif persistant) : il les double d'un
 * signal immédiatement visible.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  success(title: string, detail?: string): void {
    this.show('success', title, detail);
  }

  info(title: string, detail?: string): void {
    this.show('info', title, detail);
  }

  error(title: string, detail?: string): void {
    this.show('error', title, detail);
  }

  /**
   * Erreur issue d'une réponse HTTP : reprend le message du serveur comme détail. Le serveur est la
   * seule source qui sache *pourquoi* la requête est refusée ; `fallback` ne sert qu'au cas où il
   * n'aurait rien dit (panne réseau, 500 opaque).
   */
  fromHttp(title: string, err: unknown, fallback = 'Réessayez ou contactez le support.'): void {
    const message = (err as { error?: { message?: string | string[] } })?.error?.message;
    const detail = Array.isArray(message) ? message.join(' · ') : message;
    this.error(title, detail?.trim() || fallback);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  /** Suspend la fermeture automatique (survol) : on ne perd pas un message en cours de lecture. */
  hold(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  /** Relance la fermeture automatique à la sortie du survol. */
  resume(id: number): void {
    const toast = this.toasts().find((t) => t.id === id);
    if (toast && !this.timers.has(id)) {
      this.scheduleDismiss(id, DURATIONS[toast.kind]);
    }
  }

  private show(kind: ToastKind, title: string, detail?: string): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, kind, title, detail }]);
    this.scheduleDismiss(id, DURATIONS[kind]);
  }

  private scheduleDismiss(id: number, delay: number): void {
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), delay),
    );
  }
}

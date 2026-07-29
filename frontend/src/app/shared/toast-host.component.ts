import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

/**
 * Pile de toasts en surimpression, montée une seule fois à la racine de l'application.
 *
 * Positionnée en bas à droite : hors du chemin de lecture d'un formulaire, mais toujours dans le
 * champ de vision, quel que soit le défilement. Une erreur est annoncée en `assertive` (elle
 * interrompt le lecteur d'écran : l'action a échoué, il faut le savoir tout de suite), un succès en
 * `polite`.
 */
@Component({
  selector: 'app-toast-host',
  standalone: true,
  styles: [
    `
      .stack {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        max-width: min(26rem, calc(100vw - 2rem));
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        display: flex;
        align-items: flex-start;
        gap: 0.6rem;
        padding: 0.7rem 0.85rem;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        box-shadow: var(--shadow);
        border-left-width: 4px;
        animation: slide-in 0.18s ease-out;
      }
      /* Le liseré porte la nature du message ; le fond reste neutre pour garder le texte lisible
         dans les deux thèmes (le contraste d'un fond coloré n'est pas garanti en thème clair). */
      .toast.success { border-left-color: var(--green, #16a34a); }
      .toast.error { border-left-color: var(--red, #dc2626); }
      .toast.info { border-left-color: var(--exp, #6366f1); }
      .ico { font-size: 1rem; line-height: 1.3; }
      .body { flex: 1; min-width: 0; }
      .title { font-weight: 700; font-size: 0.9rem; }
      .detail { font-size: 0.84rem; color: var(--muted); margin-top: 0.15rem; overflow-wrap: anywhere; }
      .close {
        border: 0;
        background: transparent;
        color: var(--muted);
        font-size: 1.1rem;
        line-height: 1;
        padding: 0 0.15rem;
        cursor: pointer;
      }
      .close:hover { color: var(--text); }

      @keyframes slide-in {
        from { opacity: 0; transform: translateY(0.5rem); }
        to { opacity: 1; transform: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .toast { animation: none; }
      }
    `,
  ],
  template: `
    <div class="stack">
      @for (t of toasts(); track t.id) {
        <div
          class="toast"
          [class.success]="t.kind === 'success'"
          [class.error]="t.kind === 'error'"
          [class.info]="t.kind === 'info'"
          [attr.role]="t.kind === 'error' ? 'alert' : 'status'"
          [attr.aria-live]="t.kind === 'error' ? 'assertive' : 'polite'"
          (mouseenter)="toastService.hold(t.id)"
          (mouseleave)="toastService.resume(t.id)"
        >
          <span class="ico" aria-hidden="true">
            {{ t.kind === 'success' ? '✅' : t.kind === 'error' ? '⛔' : 'ℹ️' }}
          </span>
          <div class="body">
            <div class="title">{{ t.title }}</div>
            @if (t.detail) {
              <div class="detail">{{ t.detail }}</div>
            }
          </div>
          <button class="close" type="button" aria-label="Fermer" (click)="toastService.dismiss(t.id)">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;
}

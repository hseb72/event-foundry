import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * Logo EventFoundry (UISPEC.13 — identité visuelle). Marque vectorielle : un calendrier posé sur une
 * enclume, frappé d'une étoile, dans le dégradé de marque (orange → rose → violet → indigo) avec un
 * envol de confettis. Le mot-clé est un wordmark en deux tons (« Event » neutre + « Foundry » dégradé),
 * masquable via `[wordmark]="false"` pour n'afficher que la marque. `size` pilote la hauteur de l'icône.
 *
 * Autonome et sans dépendance : les dégradés SVG portent un identifiant unique par instance pour
 * éviter les collisions quand plusieurs logos coexistent sur une même page.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [NgClass],
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
      }
      svg {
        display: block;
        flex: 0 0 auto;
      }
      .word {
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1;
        white-space: nowrap;
        font-size: var(--logo-word-size, 1.3rem);
      }
      .word .a {
        color: var(--logo-word-color, var(--text));
      }
      .word.on-dark .a {
        color: #fff;
      }
      .word .b {
        background: var(--brand-gradient);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    `,
  ],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="EventFoundry"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient [attr.id]="gradId" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#f97316" />
          <stop offset="0.4" stop-color="#ec4899" />
          <stop offset="0.72" stop-color="#8b5cf6" />
          <stop offset="1" stop-color="#6366f1" />
        </linearGradient>
      </defs>

      <!-- Enclume (base forgée) -->
      <path
        [attr.fill]="'url(#' + gradId + ')'"
        opacity="0.92"
        d="M12 27h22a2 2 0 0 1 2 2v.4c0 1.7-1.5 2.6-3.4 2.6H30v1.2c0 1.7-1.4 2.8-3.2 2.8h-6.6c-1.9 0-3.2-1.1-3.2-2.8V34h-1.4c-1.9 0-3.6-.9-3.6-2.6V29a2 2 0 0 1 2-2Z"
      />
      <path [attr.fill]="'url(#' + gradId + ')'" d="M20.5 37h7l2.8 4.2c.3.5 0 1.1-.6 1.1H18.3c-.6 0-.9-.6-.6-1.1L20.5 37Z" />

      <!-- Calendrier -->
      <rect x="12" y="7" width="24" height="20" rx="5" [attr.fill]="'url(#' + gradId + ')'" />
      <rect x="15" y="4" width="2.6" height="6" rx="1.3" fill="#2a1b3d" opacity="0.85" />
      <rect x="30.4" y="4" width="2.6" height="6" rx="1.3" fill="#2a1b3d" opacity="0.85" />

      <!-- Étoile festive -->
      <path
        fill="#ffffff"
        d="M24 11.6l1.85 3.75 4.14.6-3 2.92.71 4.12L24 21.06l-3.7 1.95.7-4.12-2.99-2.92 4.14-.6L24 11.6Z"
      />

      <!-- Confettis (envol) -->
      <rect x="38.2" y="10.5" width="3" height="3" rx="0.8" transform="rotate(18 38.2 10.5)" fill="#f97316" />
      <rect x="41.4" y="15.8" width="2.4" height="2.4" rx="0.7" transform="rotate(-12 41.4 15.8)" fill="#ec4899" />
      <rect x="39.4" y="20.6" width="2" height="2" rx="0.6" transform="rotate(24 39.4 20.6)" fill="#6366f1" />
    </svg>

    @if (wordmark) {
      <span class="word" [ngClass]="{ 'on-dark': onDark }">
        <span class="a">Event</span><span class="b">Foundry</span>
      </span>
    }
  `,
})
export class LogoComponent {
  /** Hauteur de l'icône (px). Le wordmark s'aligne dessus. */
  @Input() size = 32;
  /** Affiche le mot-clé « EventFoundry » à côté de la marque. */
  @Input() wordmark = true;
  /** Sur fond sombre : force le « Event » en blanc (le dégradé reste lisible). */
  @Input() onDark = false;

  /** Identifiant de dégradé unique par instance (évite les collisions inter-logos sur une même page). */
  readonly gradId = `ef-logo-${Math.random().toString(36).slice(2, 8)}`;
}

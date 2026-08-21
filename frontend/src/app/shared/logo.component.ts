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
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.css',
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

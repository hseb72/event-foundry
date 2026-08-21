import { Component, Input } from '@angular/core';

/** Jeu d'icônes d'action reconnu par `<app-icon>`. */
export type IconName = 'edit' | 'duplicate' | 'archive' | 'restore';

/**
 * Icône d'action en SVG inline (UISPEC.13).
 *
 * Aucune dépendance externe et aucune police d'icônes : le tracé est dessiné en `currentColor`,
 * il hérite donc automatiquement de la couleur du bouton qui le porte (thème clair comme sombre,
 * état survolé comme désactivé).
 *
 * L'icône est purement décorative (`aria-hidden`) : le sens est porté par le `title` et l'
 * `aria-label` du bouton hôte, jamais par le dessin seul.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
}

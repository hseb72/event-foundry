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
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.css',
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from './shared/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent],
  // La pile de toasts est montée une seule fois, hors du routeur : un message survit ainsi à la
  // navigation déclenchée par l'action qui l'a produit (création suivie d'une redirection).
  template: '<router-outlet /><app-toast-host />',
})
export class AppComponent {}

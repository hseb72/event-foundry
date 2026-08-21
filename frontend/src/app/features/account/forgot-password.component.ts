import { HttpClient } from '@angular/common/http';
import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { API_BASE } from '../../core/api.config';

/**
 * « Mot de passe oublié » (FSPEC.18 §11). Page publique ; la réponse est volontairement neutre
 * (pas d'énumération de comptes) : on affiche le même message quel que soit l'e-mail saisi.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private readonly http = inject(HttpClient);

  email = '';
  readonly loading = signal(false);
  readonly sent = signal(false);

  submit(): void {
    if (!this.email) {
      return;
    }
    this.loading.set(true);
    this.http.post(`${API_BASE}/account/password/forgot`, { email: this.email }).subscribe({
      next: () => this.sent.set(true),
      // Réponse neutre même en erreur réseau : ne divulgue rien sur l'existence du compte.
      error: () => this.sent.set(true),
    });
  }
}

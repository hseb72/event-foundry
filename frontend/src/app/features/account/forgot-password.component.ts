import { HttpClient } from '@angular/common/http';
import { Component, signal } from '@angular/core';
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
  styles: [
    `
      .wrap {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #2a1b3d, #db2777);
        padding: 1rem;
      }
      .box {
        width: 100%;
        max-width: 380px;
        display: grid;
        gap: 0.9rem;
      }
      .brand {
        font-size: 1.6rem;
        font-weight: 800;
        text-align: center;
      }
      label {
        font-size: 0.85rem;
        font-weight: 600;
      }
      .muted {
        font-size: 0.9rem;
        opacity: 0.85;
      }
    `,
  ],
  template: `
    <div class="wrap">
      <form class="card box" (ngSubmit)="submit()">
        <div class="brand">EventFoundry</div>
        @if (!sent()) {
          <p class="muted">
            Saisissez l'adresse e-mail de votre compte : nous vous enverrons un lien de
            réinitialisation (valable 1 heure).
          </p>
          <label for="email">E-mail</label>
          <input id="email" class="input" type="email" name="email" [(ngModel)]="email" required />
          <button class="btn btn-primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Envoi…' : 'Envoyer le lien' }}
          </button>
        } @else {
          <p>
            Si un compte existe pour <strong>{{ email }}</strong>, un lien de réinitialisation
            vient de lui être envoyé.
          </p>
        }
        <a routerLink="/login">Retour à la connexion</a>
      </form>
    </div>
  `,
})
export class ForgotPasswordComponent {
  email = '';
  readonly loading = signal(false);
  readonly sent = signal(false);

  constructor(private readonly http: HttpClient) {}

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

import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { API_BASE } from '../../core/api.config';

/**
 * Réinitialisation du mot de passe (FSPEC.18 §11) : cible du lien de récupération. Page publique.
 * Le jeton est à usage unique et expire vite ; en cas d'échec, on renvoie vers « mot de passe
 * oublié » pour redemander un lien.
 */
@Component({
  selector: 'app-reset-password',
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
      .error {
        color: var(--red);
        font-size: 0.9rem;
      }
    `,
  ],
  template: `
    <div class="wrap">
      <form class="card box" (ngSubmit)="submit()">
        <div class="brand">EventFoundry</div>
        @if (done()) {
          <p>✅ Mot de passe modifié. Vous pouvez vous connecter.</p>
          <a class="btn btn-primary" routerLink="/login">Se connecter</a>
        } @else {
          <label for="password">Nouveau mot de passe</label>
          <input
            id="password"
            class="input"
            type="password"
            name="password"
            [(ngModel)]="password"
            minlength="8"
            required
          />
          <label for="confirm">Confirmer le mot de passe</label>
          <input
            id="confirm"
            class="input"
            type="password"
            name="confirm"
            [(ngModel)]="confirm"
            required
          />
          @if (error()) {
            <div class="error">{{ error() }}</div>
            <a routerLink="/forgot-password">Demander un nouveau lien</a>
          }
          <button class="btn btn-primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Enregistrement…' : 'Changer le mot de passe' }}
          </button>
        }
      </form>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirm = '';
  private token = '';
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly error = signal('');

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('Lien incomplet : jeton manquant.');
    }
  }

  submit(): void {
    if (this.password.length < 8) {
      this.error.set('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (this.password !== this.confirm) {
      this.error.set('Les deux mots de passe ne correspondent pas.');
      return;
    }
    this.loading.set(true);
    this.http
      .post(`${API_BASE}/account/password/reset`, { token: this.token, newPassword: this.password })
      .subscribe({
        next: () => this.done.set(true),
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? 'Lien invalide ou expiré.');
        },
      });
  }
}

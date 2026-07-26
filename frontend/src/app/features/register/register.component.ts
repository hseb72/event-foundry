import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Création de compte (FSPEC.18 §4 — inscription libre). À la validation, le compte est créé et
 * connecté immédiatement ; un lien de vérification d'e-mail est envoyé en parallèle (les
 * fonctionnalités sensibles restent limitées tant que l'adresse n'est pas vérifiée).
 */
@Component({
  selector: 'app-register',
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
        gap: 0.8rem;
      }
      .brand {
        font-size: 1.6rem;
        font-weight: 800;
        text-align: center;
        margin-bottom: 0.25rem;
      }
      label {
        font-size: 0.85rem;
        font-weight: 600;
      }
      .error {
        color: var(--red);
        font-size: 0.9rem;
      }
      .muted {
        font-size: 0.85rem;
        opacity: 0.85;
        text-align: center;
      }
    `,
  ],
  template: `
    <div class="wrap">
      <form class="card box" (ngSubmit)="submit()">
        <div class="brand">Créer un compte</div>
        <label for="displayName">Nom affiché</label>
        <input id="displayName" class="input" name="displayName" [(ngModel)]="displayName" required />
        <label for="email">E-mail</label>
        <input id="email" class="input" type="email" name="email" [(ngModel)]="email" required />
        <label for="password">Mot de passe</label>
        <input
          id="password"
          class="input"
          type="password"
          name="password"
          [(ngModel)]="password"
          minlength="8"
          autocomplete="new-password"
          required
        />
        @if (error()) {
          <div class="error">{{ error() }}</div>
        }
        <button class="btn btn-primary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Création…' : 'Créer mon compte' }}
        </button>
        <p class="muted">Déjà inscrit ? <a routerLink="/login">Se connecter</a></p>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  displayName = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  submit(): void {
    if (!this.displayName || !this.email || this.password.length < 8) {
      this.error.set('Renseignez un nom, un e-mail et un mot de passe d’au moins 8 caractères.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.email, this.password, this.displayName).subscribe({
      next: () => void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('next') || '/home'),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Impossible de créer le compte (e-mail déjà utilisé ?).');
      },
    });
  }
}

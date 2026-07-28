import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LogoComponent } from '../../shared/logo.component';

/**
 * Création de compte (FSPEC.18 §4 — inscription libre). À la validation, le compte est créé et
 * connecté immédiatement ; un lien de vérification d'e-mail est envoyé en parallèle (les
 * fonctionnalités sensibles restent limitées tant que l'adresse n'est pas vérifiée).
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, LogoComponent],
  styles: [
    `
      .wrap {
        position: relative;
        min-height: 100vh;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: var(--brand-gradient);
        padding: 1rem;
      }
      .wrap::before,
      .wrap::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        filter: blur(70px);
        opacity: 0.5;
      }
      .wrap::before { width: 360px; height: 360px; background: #f97316; top: -120px; left: -80px; }
      .wrap::after { width: 320px; height: 320px; background: #6366f1; bottom: -100px; right: -60px; }
      .box {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 400px;
        display: grid;
        gap: 0.8rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
      }
      .brand {
        display: flex;
        justify-content: center;
        margin-bottom: 0.15rem;
      }
      .title {
        text-align: center;
        font-weight: 800;
        font-size: 1.15rem;
        margin: 0 0 0.2rem;
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
        <div class="brand"><app-logo [size]="34" /></div>
        <p class="title">Créer un compte</p>
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
        <button class="btn btn-brand" type="submit" [disabled]="loading()">
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

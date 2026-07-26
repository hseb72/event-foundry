import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
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
        margin-bottom: 0.5rem;
      }
      .error {
        color: var(--red);
        font-size: 0.9rem;
      }
      label {
        font-size: 0.85rem;
        font-weight: 600;
      }
    `,
  ],
  template: `
    <div class="wrap">
      <form class="card box" (ngSubmit)="submit()">
        <div class="brand">EventFoundry</div>
        <label for="email">E-mail</label>
        <input id="email" class="input" type="email" name="email" [(ngModel)]="email" required />
        <label for="password">Mot de passe</label>
        <input
          id="password"
          class="input"
          type="password"
          name="password"
          [(ngModel)]="password"
          required
        />
        @if (mfaRequired) {
          <label for="mfa">Code d'authentification (2FA)</label>
          <input id="mfa" class="input" name="mfa" [(ngModel)]="mfaCode" placeholder="123456 ou code de récupération"
            autocomplete="one-time-code" autofocus />
        }
        @if (error) {
          <div class="error">{{ error }}</div>
        }
        <button class="btn btn-primary" type="submit" [disabled]="loading">
          {{ loading ? 'Connexion…' : mfaRequired ? 'Valider le code' : 'Se connecter' }}
        </button>
        <a routerLink="/forgot-password" style="text-align:center; font-size:0.85rem">
          Mot de passe oublié ?
        </a>
        <p style="text-align:center; font-size:0.85rem; margin:0">
          Pas encore de compte ? <a routerLink="/register">Créer un compte</a>
        </p>
      </form>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  mfaCode = '';
  mfaRequired = false;
  error = '';
  loading = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  submit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password, this.mfaCode || undefined).subscribe({
      next: () => void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('next') || '/discover'),
      error: (err) => {
        this.loading = false;
        if (err?.error?.code === 'MFA_REQUIRED') {
          // Le mot de passe est correct : on demande le second facteur (FSPEC.18 §MFA).
          this.mfaRequired = true;
          this.error = this.mfaCode ? 'Code invalide.' : '';
        } else {
          this.error = 'Identifiants invalides.';
        }
      },
    });
  }
}

import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { API_BASE } from '../../core/api.config';

/**
 * Vérification de l'adresse e-mail (FSPEC.18 / IAM-003) : cible du lien reçu par e-mail.
 * Page publique — l'utilisateur peut arriver sans session. Consomme le jeton à l'ouverture.
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
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
        max-width: 420px;
        display: grid;
        gap: 0.9rem;
        text-align: center;
      }
      .brand {
        font-size: 1.6rem;
        font-weight: 800;
      }
      .error {
        color: var(--red);
        font-size: 0.9rem;
      }
    `,
  ],
  template: `
    <div class="wrap">
      <div class="card box">
        <div class="brand">EventFoundry</div>
        @switch (state()) {
          @case ('pending') {
            <p>Vérification de votre adresse e-mail…</p>
          }
          @case ('done') {
            <p>✅ Adresse vérifiée. Votre compte est maintenant actif.</p>
            <a class="btn btn-primary" routerLink="/login">Se connecter</a>
          }
          @case ('error') {
            <p class="error">{{ error() }}</p>
            <a class="btn" routerLink="/login">Retour à la connexion</a>
          }
        }
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  readonly state = signal<'pending' | 'done' | 'error'>('pending');
  readonly error = signal('');

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      this.error.set('Lien incomplet : jeton manquant.');
      return;
    }
    this.http.post<{ verified: boolean }>(`${API_BASE}/account/verify-email`, { token }).subscribe({
      next: () => this.state.set('done'),
      error: (err) => {
        this.state.set('error');
        this.error.set(err?.error?.message ?? 'Lien invalide ou expiré. Demandez un nouveau lien.');
      },
    });
  }
}

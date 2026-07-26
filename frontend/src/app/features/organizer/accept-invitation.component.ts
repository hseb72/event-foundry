import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrganizationsApi } from '../../core/api/organizations.service';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Acceptation d'une invitation (FSPEC.19 §7). Cible du lien reçu par e-mail.
 * - Utilisateur connecté → l'acceptation rejoint l'organisation.
 * - Sinon → redirection vers la connexion / l'inscription en conservant le lien (`next`), afin
 *   qu'un nouvel utilisateur crée d'abord son compte (avec l'adresse invitée) puis revienne ici.
 */
@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [RouterLink],
  styles: [
    `
      .wrap { min-height: 100vh; display: grid; place-items: center; background: linear-gradient(135deg, #2a1b3d, #db2777); padding: 1rem; }
      .box { width: 100%; max-width: 440px; display: grid; gap: 0.9rem; text-align: center; }
      .brand { font-size: 1.6rem; font-weight: 800; }
      .error { color: var(--red); font-size: 0.9rem; }
      .row { display: flex; gap: 0.6rem; justify-content: center; }
    `,
  ],
  template: `
    <div class="wrap">
      <div class="card box">
        <div class="brand">EventFoundry</div>
        @switch (state()) {
          @case ('pending') { <p>Traitement de votre invitation…</p> }
          @case ('auth') {
            <p>Connectez-vous ou créez un compte <strong>avec l'adresse invitée</strong> pour rejoindre l'organisation.</p>
            <div class="row">
              <a class="btn btn-primary" [routerLink]="['/register']" [queryParams]="{ next: nextUrl }">Créer un compte</a>
              <a class="btn" [routerLink]="['/login']" [queryParams]="{ next: nextUrl }">Se connecter</a>
            </div>
          }
          @case ('done') {
            <p>✅ Vous avez rejoint <strong>{{ orgName() }}</strong>.</p>
            <a class="btn btn-primary" routerLink="/organizer/organizations">Voir mes organisations</a>
          }
          @case ('error') {
            <p class="error">{{ error() }}</p>
            <a class="btn" routerLink="/welcome">Retour à l'accueil</a>
          }
        }
      </div>
    </div>
  `,
})
export class AcceptInvitationComponent implements OnInit {
  readonly state = signal<'pending' | 'auth' | 'done' | 'error'>('pending');
  readonly error = signal('');
  readonly orgName = signal('');
  nextUrl = '/accept-invitation';

  constructor(
    private readonly api: OrganizationsApi,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) {
      this.state.set('error');
      this.error.set('Lien incomplet : jeton manquant.');
      return;
    }
    this.nextUrl = `/accept-invitation?token=${token}`;
    if (!this.auth.isAuthenticated()) {
      this.state.set('auth');
      return;
    }
    this.api.acceptInvitation(token).subscribe({
      next: (res) => {
        this.orgName.set(res.organizationName);
        this.state.set('done');
      },
      error: (err) => {
        this.state.set('error');
        this.error.set(err?.error?.message ?? 'Invitation invalide ou expirée.');
      },
    });
  }
}

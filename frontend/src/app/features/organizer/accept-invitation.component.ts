import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountApi } from '../../core/api/account.service';
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
  templateUrl: './accept-invitation.component.html',
  styleUrl: './accept-invitation.component.css',
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
    const kind = this.route.snapshot.queryParamMap.get('kind');
    this.nextUrl = `/accept-invitation?token=${token}${kind ? '&kind=' + kind : ''}`;
    if (!this.auth.isAuthenticated()) {
      this.state.set('auth');
      return;
    }
    if (kind === 'operator') {
      this.account.acceptOperatorInvitation(token).subscribe({
        next: (res) => {
          this.orgName.set(`l'équipe ${res.roleName}`);
          this.state.set('done');
        },
        error: (err) => this.fail(err),
      });
      return;
    }
    this.api.acceptInvitation(token).subscribe({
      next: (res) => {
        this.orgName.set(res.organizationName);
        this.state.set('done');
      },
      error: (err) => this.fail(err),
    });
  }

  private readonly account = inject(AccountApi);

  private fail(err: unknown): void {
    this.state.set('error');
    this.error.set((err as { error?: { message?: string } })?.error?.message ?? 'Invitation invalide ou expirée.');
  }
}

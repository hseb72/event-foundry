import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { API_BASE } from '../../core/api.config';

/**
 * Confirmation de changement d'adresse e-mail (FSPEC.18 §9 / IAM-004) : cible du lien reçu sur la
 * **nouvelle** adresse. Page publique ; consomme le jeton à l'ouverture. Après succès, l'ancienne
 * adresse cesse d'être valide pour la connexion.
 */
@Component({
  selector: 'app-confirm-email-change',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './confirm-email-change.component.html',
  styleUrl: './confirm-email-change.component.css',
})
export class ConfirmEmailChangeComponent implements OnInit {
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
    this.http.post<{ confirmed: boolean }>(`${API_BASE}/account/email/confirm`, { token }).subscribe({
      next: () => this.state.set('done'),
      error: (err) => {
        this.state.set('error');
        this.error.set(err?.error?.message ?? 'Lien invalide ou expiré.');
      },
    });
  }
}

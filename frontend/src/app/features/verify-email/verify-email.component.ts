import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal, inject } from '@angular/core';
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
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly state = signal<'pending' | 'done' | 'error'>('pending');
  readonly error = signal('');

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

import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal, inject } from '@angular/core';
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  password = '';
  confirm = '';
  private token = '';
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly error = signal('');

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

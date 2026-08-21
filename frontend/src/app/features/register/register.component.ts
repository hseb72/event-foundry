import { Component, signal, inject } from '@angular/core';
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
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  displayName = '';
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  submit(): void {
    if (!this.displayName || !this.email || this.password.length < 8) {
      this.error.set('Renseignez un nom, un e-mail et un mot de passe d’au moins 8 caractères.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.email, this.password, this.displayName).subscribe({
      next: () =>
        void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('next') || '/home'),
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.error?.message ?? 'Impossible de créer le compte (e-mail déjà utilisé ?).',
        );
      },
    });
  }
}

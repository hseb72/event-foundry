import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LogoComponent } from '../../shared/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, LogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
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

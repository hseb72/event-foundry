import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';

/**
 * Client des opérations de sécurité du compte (FSPEC.18) : changement de mot de passe
 * (réauthentification) et changement d'adresse e-mail (confirmation sur la nouvelle adresse).
 * Les flux « à lien » publics (reset, confirmation) sont portés par leurs pages dédiées.
 */
@Injectable({ providedIn: 'root' })
export class AccountApi {
  constructor(private readonly http: HttpClient) {}

  changePassword(currentPassword: string, newPassword: string): Observable<{ changed: boolean }> {
    return this.http.post<{ changed: boolean }>(`${API_BASE}/account/password/change`, {
      currentPassword,
      newPassword,
    });
  }

  requestEmailChange(currentPassword: string, newEmail: string): Observable<{ accepted: boolean }> {
    return this.http.post<{ accepted: boolean }>(`${API_BASE}/account/email/change-request`, {
      currentPassword,
      newEmail,
    });
  }
}

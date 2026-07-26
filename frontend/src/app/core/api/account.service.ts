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

  /** Export RGPD des données personnelles (droit de consultation/portabilité — IAM-010). */
  exportData(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${API_BASE}/account/me/export`);
  }

  /** Journal de sécurité de l'utilisateur (connexions, changements sensibles…). */
  securityEvents(): Observable<SecurityEventDto[]> {
    return this.http.get<SecurityEventDto[]>(`${API_BASE}/account/me/security-events`);
  }

  /** Suppression (anonymisation) du compte après réauthentification. Irréversible. */
  deleteAccount(currentPassword: string): Observable<{ deleted: boolean }> {
    return this.http.post<{ deleted: boolean }>(`${API_BASE}/account/me/delete`, { currentPassword });
  }
}

/** Entrée du journal de sécurité (audit personnel). */
export interface SecurityEventDto {
  id: string;
  type: string;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
}

import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { API_BASE } from '../api.config';
import { AuthService } from '../auth/auth.service';
import { AuthTokens, Experience, IdentityMe } from '../models';

/**
 * Client du domaine Identity (TSPEC.06). Expose la vue « moi » dans un signal partagé et pilote
 * les changements de contexte (expérience / organisation). Chaque changement réémet des jetons
 * (nouveau contexte de permissions) appliqués via AuthService, puis recharge la vue « moi ».
 */
@Injectable({ providedIn: 'root' })
export class IdentityService {
  /** Identité effective courante (profil, rôles, permissions, expériences, organisations). */
  readonly me = signal<IdentityMe | null>(null);

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  loadMe(): Observable<IdentityMe> {
    return this.http
      .get<IdentityMe>(`${API_BASE}/identity/me`)
      .pipe(tap((me) => this.me.set(me)));
  }

  changeExperience(experience: Experience): Observable<IdentityMe> {
    return this.http
      .patch<AuthTokens>(`${API_BASE}/identity/me/experience`, { experience })
      .pipe(
        tap((tokens) => this.auth.applyTokens(tokens)),
        switchMap(() => this.loadMe()),
      );
  }

  switchOrganization(organizationId: string | null): Observable<IdentityMe> {
    return this.http
      .patch<AuthTokens>(`${API_BASE}/identity/me/organization`, { organizationId })
      .pipe(
        tap((tokens) => this.auth.applyTokens(tokens)),
        switchMap(() => this.loadMe()),
      );
  }
}

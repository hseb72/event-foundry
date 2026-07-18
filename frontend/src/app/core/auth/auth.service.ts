import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { API_BASE } from '../api.config';
import { AuthTokens } from '../models';

const ACCESS_KEY = 'ef.accessToken';
const REFRESH_KEY = 'ef.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Signal réactif de l'état d'authentification. */
  readonly authenticated = signal<boolean>(this.hasToken());

  /** Rafraîchissement en cours, partagé pour dédupliquer les 401 concurrents. */
  private refresh$: Observable<string> | null = null;

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${API_BASE}/auth/login`, { email, password }).pipe(
      tap((tokens) => this.storeTokens(tokens)),
    );
  }

  register(email: string, password: string, displayName: string): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${API_BASE}/auth/register`, { email, password, displayName })
      .pipe(tap((tokens) => this.storeTokens(tokens)));
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.authenticated.set(false);
  }

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  hasRefreshToken(): boolean {
    return Boolean(localStorage.getItem(REFRESH_KEY));
  }

  /**
   * Échange le refresh token contre un nouveau couple de jetons. Les appels concurrents
   * partagent la même requête (un seul /auth/refresh en vol). Émet le nouvel access token.
   */
  refreshTokens(): Observable<string> {
    if (this.refresh$) {
      return this.refresh$;
    }
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('Aucun refresh token.'));
    }

    this.refresh$ = this.http
      .post<AuthTokens>(`${API_BASE}/auth/refresh`, { refreshToken })
      .pipe(
        tap((tokens) => this.storeTokens(tokens)),
        map((tokens) => tokens.accessToken),
        finalize(() => (this.refresh$ = null)),
        shareReplay(1),
      );
    return this.refresh$;
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  /** Rôles portés par le JWT (décodage local du payload, sans vérification de signature). */
  roles(): string[] {
    const token = this.accessToken;
    if (!token) {
      return [];
    }
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const decoded = JSON.parse(json) as { roles?: unknown };
      return Array.isArray(decoded.roles) ? decoded.roles.map(String) : [];
    } catch {
      return [];
    }
  }

  isAdmin(): boolean {
    return this.roles().includes('ADMIN');
  }

  /** Identifiant de l'utilisateur courant (claim `sub` du JWT), ou null. */
  userId(): string | null {
    const token = this.accessToken;
    if (!token) {
      return null;
    }
    try {
      const json = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
      const decoded = JSON.parse(json) as { sub?: unknown };
      return typeof decoded.sub === 'string' ? decoded.sub : null;
    } catch {
      return null;
    }
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    this.authenticated.set(true);
  }

  private hasToken(): boolean {
    return Boolean(localStorage.getItem(ACCESS_KEY));
  }
}

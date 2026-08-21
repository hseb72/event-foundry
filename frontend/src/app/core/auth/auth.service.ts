import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal, inject } from '@angular/core';
import { finalize, map, Observable, shareReplay, tap, throwError } from 'rxjs';
import { API_BASE } from '../api.config';
import { AuthTokens, Experience } from '../models';

const ACCESS_KEY = 'ef.accessToken';
const REFRESH_KEY = 'ef.refreshToken';

/** Claims lus dans le JWT d'accès (décodage local, sans vérification de signature). */
interface JwtClaims {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  experience: Experience | null;
  organizationId: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  /** Claims courants (signal) : toute l'UI réagit au changement de contexte via ce signal. */
  private readonly claims = signal<JwtClaims | null>(this.decodeToken());

  /** Signal réactif de l'état d'authentification. */
  readonly authenticated = signal<boolean>(this.hasToken());

  /** Expérience active courante (réactif). */
  readonly activeExperience = computed<Experience | null>(() => this.claims()?.experience ?? null);

  /** Rafraîchissement en cours, partagé pour dédupliquer les 401 concurrents. */
  private refresh$: Observable<string> | null = null;

  login(email: string, password: string, mfaCode?: string): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${API_BASE}/auth/login`, { email, password, mfaCode })
      .pipe(tap((tokens) => this.storeTokens(tokens)));
  }

  register(email: string, password: string, displayName: string): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${API_BASE}/auth/register`, { email, password, displayName })
      .pipe(tap((tokens) => this.storeTokens(tokens)));
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.claims.set(null);
    this.authenticated.set(false);
  }

  /** Applique une nouvelle paire de jetons (ex. après changement d'expérience/organisation). */
  applyTokens(tokens: AuthTokens): void {
    this.storeTokens(tokens);
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

    this.refresh$ = this.http.post<AuthTokens>(`${API_BASE}/auth/refresh`, { refreshToken }).pipe(
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

  /** Rôles portés par le JWT. */
  roles(): string[] {
    return this.claims()?.roles ?? [];
  }

  /** Permissions effectives portées par le JWT (RBAC fin V2). */
  permissions(): string[] {
    return this.claims()?.permissions ?? [];
  }

  /** Vrai si l'utilisateur possède la permission indiquée dans le contexte courant. */
  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /** Vrai si l'utilisateur possède au moins une des permissions indiquées. */
  hasAnyPermission(...permissions: string[]): boolean {
    const granted = this.permissions();
    return permissions.some((permission) => granted.includes(permission));
  }

  activeOrganizationId(): string | null {
    return this.claims()?.organizationId ?? null;
  }

  /** Identifiant de l'utilisateur courant (claim `sub` du JWT), ou null. */
  userId(): string | null {
    return this.claims()?.sub ?? null;
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    this.claims.set(this.decodeToken());
    this.authenticated.set(true);
  }

  private hasToken(): boolean {
    return Boolean(localStorage.getItem(ACCESS_KEY));
  }

  /** Décode le payload du JWT d'accès (base64url) sans vérifier la signature. */
  private decodeToken(): JwtClaims | null {
    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) {
      return null;
    }
    try {
      const json = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
      const decoded = JSON.parse(json) as Partial<JwtClaims>;
      return {
        sub: typeof decoded.sub === 'string' ? decoded.sub : '',
        email: typeof decoded.email === 'string' ? decoded.email : '',
        roles: Array.isArray(decoded.roles) ? decoded.roles.map(String) : [],
        permissions: Array.isArray(decoded.permissions) ? decoded.permissions.map(String) : [],
        experience: (decoded.experience as Experience | null) ?? null,
        organizationId: typeof decoded.organizationId === 'string' ? decoded.organizationId : null,
      };
    } catch {
      return null;
    }
  }
}

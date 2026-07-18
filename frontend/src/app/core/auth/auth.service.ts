import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE } from '../api.config';
import { AuthTokens } from '../models';

const ACCESS_KEY = 'ef.accessToken';
const REFRESH_KEY = 'ef.refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Signal réactif de l'état d'authentification. */
  readonly authenticated = signal<boolean>(this.hasToken());

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

  isAuthenticated(): boolean {
    return this.hasToken();
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

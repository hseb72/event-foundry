import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Ajoute le Bearer, et sur 401 tente un rafraîchissement transparent : un seul
 * /auth/refresh partagé entre requêtes concurrentes, puis rejeu de la requête d'origine.
 * En cas d'échec (ou sans refresh token), déconnexion + redirection vers /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Les appels d'auth publics (login/register/refresh) ne sont ni signés ni rejoués.
  const isAuthCall = req.url.includes('/auth/');
  const token = auth.accessToken;
  const authorized = token && !isAuthCall ? withBearer(req, token) : req;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error) || isAuthCall) {
        return throwError(() => error);
      }
      if (!auth.hasRefreshToken()) {
        return giveUp(auth, router, error);
      }
      return auth.refreshTokens().pipe(
        switchMap((fresh) => next(withBearer(req, fresh))),
        catchError((refreshError: unknown) => giveUp(auth, router, refreshError)),
      );
    }),
  );
};

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function giveUp(auth: AuthService, router: Router, error: unknown): Observable<never> {
  auth.logout();
  void router.navigate(['/login']);
  return throwError(() => error);
}

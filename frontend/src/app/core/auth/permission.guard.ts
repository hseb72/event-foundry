import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Garde de route par permission (RBAC fin V2 — ADR.08). Le Backend reste seul juge : cette garde
 * n'est qu'un confort d'affichage qui évite d'ouvrir un écran dont les actions seraient refusées.
 */
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    return auth.hasPermission(permission) ? true : router.createUrlTree(['/me']);
  };
}

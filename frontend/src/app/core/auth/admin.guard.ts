import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Permissions donnant accès à l'espace d'administration (référentiels, utilisateurs, jobs, dashboard). */
const ADMIN_PERMISSIONS = ['reference.manage', 'user.manage', 'pipeline.manage', 'dashboard.view'];

/**
 * Réserve l'accès aux écrans d'administration aux détenteurs d'une permission d'administration
 * (RBAC fin V2 — ADR.08). Le Backend reste seul juge ; cette garde évite d'ouvrir un écran vide.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  return auth.hasAnyPermission(...ADMIN_PERMISSIONS) ? true : router.createUrlTree(['/me']);
};

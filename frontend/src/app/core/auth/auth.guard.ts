import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  // Visiteur non authentifié : la vitrine publique est le point d'entrée (login/inscription y mènent).
  return router.createUrlTree(['/welcome']);
};

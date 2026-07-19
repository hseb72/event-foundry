import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../auth.constants';

/**
 * Restreint une route aux détenteurs de TOUTES les permissions indiquées (RBAC fin — ADR.08),
 * vérifiées par le PermissionsGuard global. C'est le mécanisme d'autorisation privilégié en V2 ;
 * `@Roles(...)` (par nom de rôle) reste disponible pour la compatibilité V1.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../auth.constants';

/**
 * Restreint une route aux détenteurs de TOUTES les permissions indiquées (RBAC fin — ADR.08),
 * vérifiées par le PermissionsGuard global. C'est l'unique mécanisme d'autorisation de la V2.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

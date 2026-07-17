import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../auth.constants';
import type { SystemRoleName } from '../../users/constants/role.constants';

/** Restreint une route aux rôles indiqués (vérifiés par le RolesGuard global). */
export const Roles = (...roles: SystemRoleName[]) => SetMetadata(ROLES_KEY, roles);

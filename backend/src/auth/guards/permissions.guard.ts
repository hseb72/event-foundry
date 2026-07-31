import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../auth.constants';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Guard global d'autorisation par permissions (RBAC fin — ADR.08). S'exécute après le
 * JwtAuthGuard. Sans @RequirePermissions(...), la route est ouverte à tout utilisateur
 * authentifié. Avec, l'utilisateur doit posséder TOUTES les permissions requises.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const granted = request.user?.permissions ?? [];
    const missing = required.filter((permission) => !granted.includes(permission));
    if (missing.length > 0) {
      throw new ForbiddenException(`Permission requise manquante : ${missing.join(', ')}.`);
    }
    return true;
  }
}

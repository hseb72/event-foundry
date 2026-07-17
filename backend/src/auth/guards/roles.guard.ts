import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../auth.constants';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Guard global d'autorisation par rôles (RBAC — TSPEC.07). S'exécute après le
 * JwtAuthGuard. Sans @Roles(...), la route est ouverte à tout utilisateur authentifié.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      return false;
    }
    return required.some((role) => user.roles.includes(role));
  }
}

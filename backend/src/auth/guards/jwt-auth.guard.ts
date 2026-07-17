import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../auth.constants';
import type { AuthenticatedUser, JwtPayload } from '../types/authenticated-user';

/**
 * Guard global d'authentification. Vérifie le JWT d'accès (Bearer) et attache
 * l'utilisateur à la requête. Les routes annotées @Public() sont ignorées.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException("Jeton d'accès manquant.");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      request.user = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
      };
      return true;
    } catch {
      throw new UnauthorizedException("Jeton d'accès invalide ou expiré.");
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) {
      return undefined;
    }
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : undefined;
  }
}

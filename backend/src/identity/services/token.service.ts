import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { AuthTokensDto } from '../../auth/dto/auth-tokens.dto';
import type { JwtPayload } from '../../auth/types/authenticated-user';
import type { EffectiveIdentity } from '../interfaces/effective-identity';

/**
 * Émet la paire de jetons à partir de l'identité effective. Le JWT d'accès encode rôles,
 * permissions et contexte actif (expérience / organisation) pour un contrôle d'accès rapide
 * côté guards (TSPEC.06). Le refresh ne porte que le sujet : le contexte est recalculé au refresh.
 *
 * Placé dans le domaine Identity (et non `auth`) car il encode des claims d'identité : cela évite
 * un cycle de modules `auth` ⇄ `identity` (AuthModule importe IdentityModule, pas l'inverse).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueTokens(identity: EffectiveIdentity): Promise<AuthTokensDto> {
    const payload: JwtPayload = {
      sub: identity.userId,
      email: identity.email,
      roles: identity.roles,
      permissions: identity.permissions,
      experience: identity.activeExperience,
      organizationId: identity.activeOrganizationId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      // @nestjs/jwt 11 type `expiresIn` en durée littérale : valeur issue de la config (env).
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '3600s') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(
      { sub: identity.userId },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as JwtSignOptions['expiresIn'],
      },
    );

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }
}

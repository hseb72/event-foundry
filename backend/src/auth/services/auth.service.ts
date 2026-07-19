import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  IDENTITY_SERVICE,
  type IIdentityService,
} from '../../identity/interfaces/identity-service.interface';
import { TokenService } from '../../identity/services/token.service';
import {
  IUsersService,
  USERS_SERVICE,
} from '../../users/interfaces/users-service.interface';
import { AuthTokensDto } from '../dto/auth-tokens.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { RegisterDto } from '../dto/register.dto';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';

const SALT_ROUNDS = 12;

/**
 * Authentification (TSPEC.06). Vérifie les identifiants et le refresh, puis délègue le calcul de
 * l'identité effective à Identity et l'émission des jetons à TokenService. Les jetons encodent
 * les rôles, permissions et contexte actif recalculés à chaque émission (jamais périmés au-delà
 * de la durée de vie du jeton d'accès).
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_SERVICE) private readonly users: IUsersService,
    @Inject(IDENTITY_SERVICE) private readonly identity: IIdentityService,
    private readonly tokens: TokenService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.users.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
    });
    // Tout nouvel inscrit est un Explorer (FSPEC.10) : rôle et expérience par défaut.
    await this.identity.assignDefaultExplorerRole(user.id);
    return this.issueFor(user.id);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.users.findByEmailWithRoles(dto.email);
    if (!user || !user.isActive) {
      throw new InvalidCredentialsException();
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }
    return this.issueFor(user.id);
  }

  async refresh(dto: RefreshDto): Promise<AuthTokensDto> {
    let subject: string;
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      subject = payload.sub;
    } catch {
      throw new UnauthorizedException('Jeton de rafraîchissement invalide ou expiré.');
    }

    const user = await this.users.findByIdWithRoles(subject);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Jeton de rafraîchissement invalide ou expiré.');
    }
    return this.issueFor(user.id);
  }

  private async issueFor(userId: string): Promise<AuthTokensDto> {
    const identity = await this.identity.getEffectiveIdentity(userId);
    return this.tokens.issueTokens(identity);
  }
}

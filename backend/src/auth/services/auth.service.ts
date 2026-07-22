import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AccountLifecycleService } from '../../account/services/account-lifecycle.service';
import { SECURITY_EVENTS, SecurityAuditService } from '../../account/services/security-audit.service';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USERS_SERVICE) private readonly users: IUsersService,
    @Inject(IDENTITY_SERVICE) private readonly identity: IIdentityService,
    private readonly tokens: TokenService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly lifecycle: AccountLifecycleService,
    private readonly audit: SecurityAuditService,
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
    // Cycle de vie (FSPEC.18) : lien de vérification d'e-mail + audit. La connexion est permise
    // avant vérification (IAM-003 — fonctionnalités limitées), et **l'inscription n'est jamais
    // bloquée** : l'envoi du lien (SMTP) est best-effort, une panne n'invalide pas le compte créé.
    await this.audit.record(SECURITY_EVENTS.ACCOUNT_CREATED, user.id);
    try {
      await this.lifecycle.issueEmailVerification(user);
    } catch (error) {
      this.logger.error(`Lien de vérification non émis pour ${user.email} (compte tout de même créé)`, error as Error);
    }
    return this.issueFor(user.id);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.users.findByEmailWithRoles(dto.email);
    if (!user || !user.isActive) {
      await this.audit.record(SECURITY_EVENTS.LOGIN_FAILED, user?.id ?? null, { email: dto.email });
      throw new InvalidCredentialsException();
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      await this.audit.record(SECURITY_EVENTS.LOGIN_FAILED, user.id);
      throw new InvalidCredentialsException();
    }
    await this.audit.record(SECURITY_EVENTS.LOGIN_SUCCEEDED, user.id);
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

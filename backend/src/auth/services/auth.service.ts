import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { UserWithRoles } from '../../users/entities/user.entity';
import {
  IUsersService,
  USERS_SERVICE,
} from '../../users/interfaces/users-service.interface';
import { AuthTokensDto } from '../dto/auth-tokens.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { RegisterDto } from '../dto/register.dto';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';
import type { JwtPayload } from '../types/authenticated-user';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_SERVICE) private readonly users: IUsersService,
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
    return this.issueTokens(user);
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
    return this.issueTokens(user);
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
    return this.issueTokens(user);
  }

  private async issueTokens(user: UserWithRoles): Promise<AuthTokensDto> {
    const roles = user.roles.map((assignment) => assignment.role.name);
    const payload: JwtPayload = { sub: user.id, email: user.email, roles };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      // jsonwebtoken (via @nestjs/jwt 11) type `expiresIn` en durée littérale : la valeur
      // vient de la config (env), on la transmet telle quelle.
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '3600s') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as JwtSignOptions['expiresIn'],
      },
    );

    return { accessToken, refreshToken, tokenType: 'Bearer' };
  }
}

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { EffectiveIdentity } from '../../identity/interfaces/effective-identity';
import type { IIdentityService } from '../../identity/interfaces/identity-service.interface';
import type { TokenService } from '../../identity/services/token.service';
import type { UserWithRoles } from '../../users/entities/user.entity';
import type { IUsersService } from '../../users/interfaces/users-service.interface';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

function fakeUser(overrides: Partial<UserWithRoles> = {}): UserWithRoles {
  return {
    id: 'user-1',
    email: 'joueur@example.com',
    passwordHash: 'hashed',
    displayName: 'Joueur',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ role: { name: 'Explorer' } }],
    ...overrides,
  } as unknown as UserWithRoles;
}

const TOKENS = { accessToken: 'access', refreshToken: 'refresh', tokenType: 'Bearer' };

describe('AuthService', () => {
  let users: jest.Mocked<IUsersService>;
  let identity: jest.Mocked<IIdentityService>;
  let tokens: jest.Mocked<Pick<TokenService, 'issueTokens'>>;
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let config: { getOrThrow: jest.Mock; get: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    users = {
      findByEmailWithRoles: jest.fn(),
      findByIdWithRoles: jest.fn(),
      createUser: jest.fn(),
    };
    identity = {
      getEffectiveIdentity: jest.fn().mockResolvedValue({ userId: 'user-1' } as EffectiveIdentity),
      getIdentityGraph: jest.fn(),
      changeActiveExperience: jest.fn(),
      changeActiveOrganization: jest.fn(),
      updateProfile: jest.fn(),
      assignDefaultExplorerRole: jest.fn().mockResolvedValue(undefined),
    };
    tokens = { issueTokens: jest.fn().mockResolvedValue(TOKENS) };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    };
    config = {
      getOrThrow: jest.fn().mockReturnValue('secret'),
      get: jest.fn().mockReturnValue('3600s'),
    };
    service = new AuthService(
      users,
      identity,
      tokens as unknown as TokenService,
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('émet une paire de jetons au login avec des identifiants valides', async () => {
    users.findByEmailWithRoles.mockResolvedValue(fakeUser());
    bcryptMock.compare.mockResolvedValue(true as never);

    const result = await service.login({ email: 'joueur@example.com', password: 'ok' });

    expect(result).toEqual(TOKENS);
    expect(identity.getEffectiveIdentity).toHaveBeenCalledWith('user-1');
    expect(tokens.issueTokens).toHaveBeenCalledTimes(1);
  });

  it('assigne le rôle Explorer par défaut à l’inscription', async () => {
    users.createUser.mockResolvedValue(fakeUser());
    bcryptMock.hash.mockResolvedValue('hashed' as never);

    await service.register({ email: 'joueur@example.com', password: 'ok', displayName: 'Joueur' });

    expect(identity.assignDefaultExplorerRole).toHaveBeenCalledWith('user-1');
    expect(tokens.issueTokens).toHaveBeenCalledTimes(1);
  });

  it("rejette le login quand l'utilisateur est introuvable", async () => {
    users.findByEmailWithRoles.mockResolvedValue(null);
    await expect(
      service.login({ email: 'inconnu@example.com', password: 'x' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it('rejette le login quand le mot de passe ne correspond pas', async () => {
    users.findByEmailWithRoles.mockResolvedValue(fakeUser());
    bcryptMock.compare.mockResolvedValue(false as never);
    await expect(
      service.login({ email: 'joueur@example.com', password: 'faux' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });
});

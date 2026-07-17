import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
    roles: [{ role: { name: 'USER' } }],
    ...overrides,
  } as unknown as UserWithRoles;
}

describe('AuthService', () => {
  let users: jest.Mocked<IUsersService>;
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let config: { getOrThrow: jest.Mock; get: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    users = {
      findByEmailWithRoles: jest.fn(),
      findByIdWithRoles: jest.fn(),
      createUser: jest.fn(),
    };
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
      jwtService as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  it('émet une paire de jetons au login avec des identifiants valides', async () => {
    users.findByEmailWithRoles.mockResolvedValue(fakeUser());
    bcryptMock.compare.mockResolvedValue(true as never);

    const tokens = await service.login({ email: 'joueur@example.com', password: 'ok' });

    expect(tokens.accessToken).toBe('signed-token');
    expect(tokens.refreshToken).toBe('signed-token');
    expect(tokens.tokenType).toBe('Bearer');
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
  });

  it('rejette le login quand l\'utilisateur est introuvable', async () => {
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

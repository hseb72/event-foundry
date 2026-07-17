import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function makeContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('autorise quand aucun rôle n\'est requis', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext({ roles: [] }))).toBe(true);
  });

  it('autorise quand l\'utilisateur possède un rôle requis', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(guard.canActivate(makeContext({ roles: ['USER', 'ADMIN'] }))).toBe(true);
  });

  it('refuse quand l\'utilisateur ne possède aucun rôle requis', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    expect(guard.canActivate(makeContext({ roles: ['USER'] }))).toBe(false);
  });

  it('refuse quand aucun utilisateur n\'est authentifié', () => {
    reflector.getAllAndOverride.mockReturnValue(['USER']);
    expect(guard.canActivate(makeContext(undefined))).toBe(false);
  });
});

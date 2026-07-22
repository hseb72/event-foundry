import type { UserWithRoles } from '../entities/user.entity';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
import { SelfAdminModificationException } from '../exceptions/self-admin-modification.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import { SecurityAuditService } from '../../account/services/security-audit.service';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { UsersService } from './users.service';

function fakeUser(id: string): UserWithRoles {
  return {
    id,
    email: `${id}@x.io`,
    passwordHash: 'h',
    displayName: id,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [{ userId: id, roleId: 'r-user', assignedAt: new Date(), role: { id: 'r-user', name: 'USER', createdAt: new Date(), updatedAt: new Date() } }],
  } as unknown as UserWithRoles;
}

describe('UsersService (administration)', () => {
  let users: jest.Mocked<Pick<UserRepository, 'findByIdWithRoles' | 'setActive' | 'replaceRoles' | 'listWithRoles'>>;
  let roles: jest.Mocked<Pick<RoleRepository, 'findByNames' | 'findByName'>>;
  let audit: { record: jest.Mock };
  let service: UsersService;

  beforeEach(() => {
    users = {
      findByIdWithRoles: jest.fn().mockResolvedValue(fakeUser('u1')),
      setActive: jest.fn().mockResolvedValue(fakeUser('u1')),
      replaceRoles: jest.fn().mockResolvedValue(fakeUser('u1')),
      listWithRoles: jest.fn().mockResolvedValue([]),
    };
    roles = {
      findByNames: jest.fn().mockResolvedValue([
        { id: 'r-user', name: 'USER' },
        { id: 'r-admin', name: 'ADMIN' },
      ]),
      findByName: jest.fn(),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new UsersService(
      users as unknown as UserRepository,
      roles as unknown as RoleRepository,
      audit as unknown as SecurityAuditService,
    );
  });

  it('interdit à un admin de se désactiver lui-même', async () => {
    await expect(service.setActive('u1', false, 'u1')).rejects.toBeInstanceOf(
      SelfAdminModificationException,
    );
    expect(users.setActive).not.toHaveBeenCalled();
  });

  it('autorise la désactivation d’un autre compte', async () => {
    await service.setActive('u2', false, 'u1');
    expect(users.setActive).toHaveBeenCalledWith('u2', false);
  });

  it('historise la suspension (acteur = Operator courant) — IAM-009', async () => {
    await service.setActive('u2', false, 'op-1');
    expect(audit.record).toHaveBeenCalledWith('account.suspended', 'u2', { by: 'op-1' });
  });

  it('historise la réactivation', async () => {
    await service.setActive('u2', true, 'op-1');
    expect(audit.record).toHaveBeenCalledWith('account.reactivated', 'u2', { by: 'op-1' });
  });

  it('interdit à un admin de retirer son propre rôle ADMIN', async () => {
    await expect(service.setRoles('u1', ['USER'], 'u1')).rejects.toBeInstanceOf(
      SelfAdminModificationException,
    );
    expect(users.replaceRoles).not.toHaveBeenCalled();
  });

  it('rejette un rôle inconnu', async () => {
    roles.findByNames.mockResolvedValueOnce([{ id: 'r-user', name: 'USER' }] as never);
    await expect(service.setRoles('u2', ['USER', 'WIZARD'], 'u1')).rejects.toBeInstanceOf(
      RoleNotFoundException,
    );
  });

  it('remplace les rôles avec les ids résolus', async () => {
    await service.setRoles('u2', ['USER', 'ADMIN'], 'u1');
    expect(users.replaceRoles).toHaveBeenCalledWith('u2', ['r-user', 'r-admin']);
  });

  it('échoue si l’utilisateur cible est introuvable', async () => {
    users.findByIdWithRoles.mockResolvedValueOnce(null);
    await expect(service.setActive('ghost', true, 'u1')).rejects.toBeInstanceOf(
      UserNotFoundException,
    );
  });
});

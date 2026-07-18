import { Injectable } from '@nestjs/common';
import type { UserWithRoles } from '../entities/user.entity';
import { SystemRole } from '../constants/role.constants';
import { EmailAlreadyUsedException } from '../exceptions/email-already-used.exception';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
import { SelfAdminModificationException } from '../exceptions/self-admin-modification.exception';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';
import type { CreateUserInput, IUsersService } from '../interfaces/users-service.interface';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
  ) {}

  findByEmailWithRoles(email: string): Promise<UserWithRoles | null> {
    return this.userRepository.findByEmail(email);
  }

  findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    return this.userRepository.findByIdWithRoles(id);
  }

  /** Crée un utilisateur avec le rôle par défaut USER. Le mot de passe est déjà haché. */
  async createUser(input: CreateUserInput): Promise<UserWithRoles> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyUsedException(input.email);
    }

    const defaultRole = await this.roleRepository.findByName(SystemRole.USER);
    if (!defaultRole) {
      throw new RoleNotFoundException(SystemRole.USER);
    }

    return this.userRepository.createWithRole({
      email: input.email,
      passwordHash: input.passwordHash,
      displayName: input.displayName,
      roleId: defaultRole.id,
    });
  }

  /** Administration : liste de tous les utilisateurs avec leurs rôles. */
  listAll(): Promise<UserWithRoles[]> {
    return this.userRepository.listWithRoles();
  }

  /** Active / désactive un compte. Un admin ne peut pas désactiver le sien (anti-verrouillage). */
  async setActive(id: string, isActive: boolean, currentUserId: string): Promise<UserWithRoles> {
    if (id === currentUserId && !isActive) {
      throw new SelfAdminModificationException('désactivation impossible');
    }
    await this.getOrThrow(id);
    return this.userRepository.setActive(id, isActive);
  }

  /**
   * Remplace l'ensemble des rôles d'un utilisateur. Un admin ne peut pas retirer son propre
   * rôle ADMIN (anti-verrouillage). Tous les noms de rôles doivent exister.
   */
  async setRoles(id: string, roleNames: string[], currentUserId: string): Promise<UserWithRoles> {
    await this.getOrThrow(id);

    const uniqueNames = [...new Set(roleNames)];
    if (id === currentUserId && !uniqueNames.includes(SystemRole.ADMIN)) {
      throw new SelfAdminModificationException('retrait de votre propre rôle ADMIN');
    }

    const roles = await this.roleRepository.findByNames(uniqueNames);
    if (roles.length !== uniqueNames.length) {
      const known = new Set(roles.map((role) => role.name));
      const missing = uniqueNames.find((name) => !known.has(name));
      throw new RoleNotFoundException(missing ?? 'inconnu');
    }

    return this.userRepository.replaceRoles(
      id,
      roles.map((role) => role.id),
    );
  }

  private async getOrThrow(id: string): Promise<UserWithRoles> {
    const user = await this.userRepository.findByIdWithRoles(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return user;
  }
}

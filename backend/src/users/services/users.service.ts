import { Injectable } from '@nestjs/common';
import type { UserWithRoles } from '../entities/user.entity';
import { SystemRole } from '../constants/role.constants';
import { EmailAlreadyUsedException } from '../exceptions/email-already-used.exception';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
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
}

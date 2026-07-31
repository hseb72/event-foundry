import type { UserWithRoles } from '../entities/user.entity';

/** Jeton d'injection pour dépendre de l'abstraction et non de l'implémentation (ADR.07). */
export const USERS_SERVICE = Symbol('USERS_SERVICE');

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
}

/** Contrat exposé aux autres modules (ex. `auth`). */
export interface IUsersService {
  findByEmailWithRoles(email: string): Promise<UserWithRoles | null>;
  findByIdWithRoles(id: string): Promise<UserWithRoles | null>;
  createUser(input: CreateUserInput): Promise<UserWithRoles>;
}

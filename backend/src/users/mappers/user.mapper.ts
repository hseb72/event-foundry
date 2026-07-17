import { UserResponseDto } from '../dto/user-response.dto';
import type { UserWithRoles } from '../entities/user.entity';

/** Conversion Entity → DTO. Aucune conversion réalisée ailleurs (TSPEC.01). */
export class UserMapper {
  static toResponse(user: UserWithRoles): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: user.roles.map((assignment) => assignment.role.name),
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

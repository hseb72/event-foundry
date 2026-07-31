import type { Alias } from '@prisma/client';
import { AliasResponseDto } from './alias.dto';

export class AliasMapper {
  static toResponse(alias: Alias): AliasResponseDto {
    return {
      id: alias.id,
      value: alias.value,
      activityId: alias.activityId,
      isActive: alias.isActive,
      createdAt: alias.createdAt.toISOString(),
    };
  }
}

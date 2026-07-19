import type { Tag } from '@prisma/client';
import { TagResponseDto } from './tag.dto';

export class TagMapper {
  static toResponse(tag: Tag): TagResponseDto {
    return {
      id: tag.id,
      name: tag.name,
      isActive: tag.isActive,
      createdAt: tag.createdAt.toISOString(),
    };
  }
}

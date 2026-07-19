import type { Category } from '@prisma/client';
import { CategoryResponseDto } from './category.dto';

export class CategoryMapper {
  static toResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
    };
  }
}

import { Injectable } from '@nestjs/common';
import type { Category } from '@prisma/client';
import { CategoryNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CategoryRepository } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoryRepository) {}

  list(includeInactive: boolean): Promise<Category[]> {
    return this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new CategoryNotFoundException(id);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    try {
      return await this.repository.create({ name: dto.name });
    } catch (error) {
      rethrowAsConflict(error, `Une Category « ${dto.name} » existe déjà.`);
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Une Category « ${dto.name} » existe déjà.`);
    }
  }

  async deactivate(id: string): Promise<Category> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}

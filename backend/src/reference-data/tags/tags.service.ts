import { Injectable } from '@nestjs/common';
import type { Tag } from '@prisma/client';
import { TagNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CreateTagDto, UpdateTagDto } from './tag.dto';
import { TagRepository } from './tag.repository';

@Injectable()
export class TagsService {
  constructor(private readonly repository: TagRepository) {}

  list(includeInactive: boolean): Promise<Tag[]> {
    return this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<Tag> {
    const tag = await this.repository.findById(id);
    if (!tag) {
      throw new TagNotFoundException(id);
    }
    return tag;
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    try {
      return await this.repository.create({ name: dto.name });
    } catch (error) {
      rethrowAsConflict(error, `Un Tag « ${dto.name} » existe déjà.`);
    }
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Un Tag « ${dto.name} » existe déjà.`);
    }
  }

  async deactivate(id: string): Promise<Tag> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}

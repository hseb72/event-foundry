import { Injectable } from '@nestjs/common';
import type { Subject } from '@prisma/client';
import { SubjectNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { SubjectRepository } from './subject.repository';
import { CreateSubjectDto, UpdateSubjectDto } from './subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly repository: SubjectRepository) {}

  list(params: { familyId?: string; activityId?: string; includeInactive: boolean }): Promise<Subject[]> {
    return this.repository.list(params);
  }

  async getOrThrow(id: string): Promise<Subject> {
    const subject = await this.repository.findById(id);
    if (!subject) {
      throw new SubjectNotFoundException(id);
    }
    return subject;
  }

  async create(dto: CreateSubjectDto): Promise<Subject> {
    try {
      return await this.repository.create({ name: dto.name, familyId: dto.familyId });
    } catch (error) {
      rethrowAsConflict(error, `Un Subject « ${dto.name} » existe déjà dans cette Family.`);
    }
  }

  async update(id: string, dto: UpdateSubjectDto): Promise<Subject> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Un Subject « ${dto.name} » existe déjà dans cette Family.`);
    }
  }

  async deactivate(id: string): Promise<Subject> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}

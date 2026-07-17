import { Injectable } from '@nestjs/common';
import type { Domain } from '@prisma/client';
import { DomainNotFoundException } from '../common/exceptions';
import { rethrowAsConflict } from '../common/prisma-error';
import { CreateDomainDto, UpdateDomainDto } from './domain.dto';
import { DomainRepository } from './domain.repository';

@Injectable()
export class DomainsService {
  constructor(private readonly repository: DomainRepository) {}

  list(includeInactive: boolean): Promise<Domain[]> {
    return this.repository.list(includeInactive);
  }

  async getOrThrow(id: string): Promise<Domain> {
    const domain = await this.repository.findById(id);
    if (!domain) {
      throw new DomainNotFoundException(id);
    }
    return domain;
  }

  async create(dto: CreateDomainDto): Promise<Domain> {
    try {
      return await this.repository.create({ name: dto.name });
    } catch (error) {
      rethrowAsConflict(error, `Un Domain nommé « ${dto.name} » existe déjà.`);
    }
  }

  async update(id: string, dto: UpdateDomainDto): Promise<Domain> {
    await this.getOrThrow(id);
    try {
      return await this.repository.update(id, dto);
    } catch (error) {
      rethrowAsConflict(error, `Un Domain nommé « ${dto.name} » existe déjà.`);
    }
  }

  async deactivate(id: string): Promise<Domain> {
    await this.getOrThrow(id);
    return this.repository.deactivate(id);
  }
}

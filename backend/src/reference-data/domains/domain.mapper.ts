import type { Domain } from '@prisma/client';
import { DomainResponseDto } from './domain.dto';

export class DomainMapper {
  static toResponse(domain: Domain): DomainResponseDto {
    return {
      id: domain.id,
      name: domain.name,
      isActive: domain.isActive,
      createdAt: domain.createdAt.toISOString(),
    };
  }
}

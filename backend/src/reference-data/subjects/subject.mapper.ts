import type { Subject } from '@prisma/client';
import { SubjectResponseDto } from './subject.dto';

export class SubjectMapper {
  static toResponse(subject: Subject): SubjectResponseDto {
    return {
      id: subject.id,
      name: subject.name,
      familyId: subject.familyId,
      isActive: subject.isActive,
      provisional: subject.provisional,
      createdAt: subject.createdAt.toISOString(),
    };
  }
}

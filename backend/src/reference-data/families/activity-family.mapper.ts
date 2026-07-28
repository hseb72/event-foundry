import type { ActivityFamily } from '@prisma/client';
import { ActivityFamilyResponseDto } from './activity-family.dto';

export class ActivityFamilyMapper {
  static toResponse(family: ActivityFamily): ActivityFamilyResponseDto {
    return {
      id: family.id,
      name: family.name,
      activityId: family.activityId,
      isActive: family.isActive,
      provisional: family.provisional,
      createdAt: family.createdAt.toISOString(),
    };
  }
}

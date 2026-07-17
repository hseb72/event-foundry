import type { Activity } from '@prisma/client';
import { ActivityResponseDto } from './activity.dto';

export class ActivityMapper {
  static toResponse(activity: Activity): ActivityResponseDto {
    return {
      id: activity.id,
      name: activity.name,
      domainId: activity.domainId,
      isActive: activity.isActive,
      createdAt: activity.createdAt.toISOString(),
    };
  }
}

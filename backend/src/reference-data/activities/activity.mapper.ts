import type { Activity } from '@prisma/client';
import { ActivityResponseDto } from './activity.dto';

export class ActivityMapper {
  static toResponse(activity: Activity & { aliases?: { value: string }[] }): ActivityResponseDto {
    return {
      id: activity.id,
      name: activity.name,
      domainId: activity.domainId,
      isActive: activity.isActive,
      aliases: (activity.aliases ?? []).map((alias) => alias.value),
      createdAt: activity.createdAt.toISOString(),
    };
  }
}

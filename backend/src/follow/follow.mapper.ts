import type { Follow } from '@prisma/client';
import { FollowDto } from './dto/follow.dto';

export class FollowMapper {
  static toResponse(follow: Follow): FollowDto {
    return {
      id: follow.id,
      targetType: follow.targetType,
      targetId: follow.targetId,
      notify: follow.notify,
      createdAt: follow.createdAt.toISOString(),
    };
  }
}

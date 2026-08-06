import type { Alias } from '@prisma/client';
import { aliasTargetOf } from './alias-target';
import { AliasResponseDto } from './alias.dto';

export class AliasMapper {
  static toResponse(alias: Alias): AliasResponseDto {
    const target = aliasTargetOf(alias);
    return {
      id: alias.id,
      value: alias.value,
      // La cible est exposée sous forme générique : un alias porte désormais sur l'un des cinq
      // référentiels, pas seulement sur une activité.
      target: target?.target ?? 'ACTIVITY',
      targetId: target?.targetId ?? '',
      activityId: alias.activityId,
      isActive: alias.isActive,
      createdAt: alias.createdAt.toISOString(),
    };
  }
}

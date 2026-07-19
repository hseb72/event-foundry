import type { Region } from '@prisma/client';
import { RegionResponseDto } from './region.dto';

export class RegionMapper {
  static toResponse(region: Region): RegionResponseDto {
    return {
      id: region.id,
      name: region.name,
      countryId: region.countryId,
      isActive: region.isActive,
      createdAt: region.createdAt.toISOString(),
    };
  }
}

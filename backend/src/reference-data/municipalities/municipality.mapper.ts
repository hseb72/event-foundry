import type { Municipality } from '@prisma/client';
import { MunicipalityResponseDto } from './municipality.dto';

export class MunicipalityMapper {
  static toResponse(municipality: Municipality): MunicipalityResponseDto {
    return {
      id: municipality.id,
      name: municipality.name,
      regionId: municipality.regionId,
      postalCode: municipality.postalCode,
      isActive: municipality.isActive,
      createdAt: municipality.createdAt.toISOString(),
    };
  }
}

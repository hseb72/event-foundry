import type { Modality } from '@prisma/client';
import { ModalityResponseDto } from './modality.dto';

export class ModalityMapper {
  static toResponse(modality: Modality): ModalityResponseDto {
    return {
      id: modality.id,
      name: modality.name,
      dimensionId: modality.dimensionId,
      isActive: modality.isActive,
      provisional: modality.provisional,
      createdAt: modality.createdAt.toISOString(),
    };
  }
}

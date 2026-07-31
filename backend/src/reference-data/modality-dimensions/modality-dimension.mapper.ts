import type { ModalityDimension } from '@prisma/client';
import { ModalityMapper } from '../modalities/modality.mapper';
import { ModalityDimensionResponseDto } from './modality-dimension.dto';
import type { ModalityDimensionWithModalities } from './modality-dimension.repository';

export class ModalityDimensionMapper {
  static toResponse(dimension: ModalityDimensionWithModalities): ModalityDimensionResponseDto {
    return {
      id: dimension.id,
      name: dimension.name,
      isActive: dimension.isActive,
      createdAt: dimension.createdAt.toISOString(),
      modalities: dimension.modalities.map(ModalityMapper.toResponse),
    };
  }

  /** Réponse sans les modalités (création / mise à jour d'une dimension). */
  static toResponseShallow(dimension: ModalityDimension): ModalityDimensionResponseDto {
    return {
      id: dimension.id,
      name: dimension.name,
      isActive: dimension.isActive,
      createdAt: dimension.createdAt.toISOString(),
      modalities: [],
    };
  }
}

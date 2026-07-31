import type { Municipality, Region, Country } from '@prisma/client';
import { MunicipalityGeoDto, MunicipalityResponseDto } from './municipality.dto';

/** Commune enrichie de sa région et de son pays (pour la vue géographique dérivée). */
export type MunicipalityWithGeo = Municipality & { region: Region & { country: Country } };

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

  /** Vue géographique : la région (et le pays) sont dérivés de la commune (chantier §8.1). */
  static toGeo(municipality: MunicipalityWithGeo): MunicipalityGeoDto {
    return {
      id: municipality.id,
      name: municipality.name,
      postalCode: municipality.postalCode,
      regionId: municipality.regionId,
      regionName: municipality.region.name,
      countryId: municipality.region.countryId,
      countryName: municipality.region.country.name,
    };
  }
}

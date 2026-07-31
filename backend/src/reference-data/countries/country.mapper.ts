import type { Country } from '@prisma/client';
import { CountryResponseDto } from './country.dto';

export class CountryMapper {
  static toResponse(country: Country): CountryResponseDto {
    return {
      id: country.id,
      name: country.name,
      code: country.code,
      isActive: country.isActive,
      createdAt: country.createdAt.toISOString(),
    };
  }
}

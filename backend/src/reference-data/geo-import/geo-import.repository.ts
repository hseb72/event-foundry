import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Ligne commune prête à l'insertion (projetée depuis GeoNames). */
export interface MunicipalityInsert {
  name: string;
  regionId: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
}

export interface GeoCounts {
  countries: number;
  regions: number;
  municipalities: number;
}

/**
 * Accès PostgreSQL pour l'ingestion du référentiel géographique (GeoNames — TSPEC.03). Seul point
 * d'accès Prisma de la fonctionnalité (ADR.02). Écritures idempotentes (upsert / skipDuplicates).
 */
@Injectable()
export class GeoImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertCountry(code: string, name: string): Promise<string> {
    const country = await this.prisma.country.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
    return country.id;
  }

  async upsertRegion(countryId: string, name: string, code: string | null): Promise<string> {
    const region = await this.prisma.region.upsert({
      where: { countryId_name: { countryId, name } },
      update: { code: code ?? undefined },
      create: { name, code, countryId },
    });
    return region.id;
  }

  /** Insère un lot de communes ; les doublons (region, name, postalCode) sont ignorés (idempotent). */
  async insertMunicipalities(rows: MunicipalityInsert[]): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const result = await this.prisma.municipality.createMany({ data: rows, skipDuplicates: true });
    return result.count;
  }

  async counts(): Promise<GeoCounts> {
    const [countries, regions, municipalities] = await Promise.all([
      this.prisma.country.count(),
      this.prisma.region.count(),
      this.prisma.municipality.count(),
    ]);
    return { countries, regions, municipalities };
  }
}

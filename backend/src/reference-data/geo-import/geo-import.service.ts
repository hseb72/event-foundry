import { ConflictException, Injectable, Logger } from '@nestjs/common';
import {
  countryNameFor,
  fetchGeoNamesRows,
  GEONAMES_DEFAULT_BASE_URL,
  type GeoRow,
} from './geonames.util';
import { GeoCounts, GeoImportRepository, MunicipalityInsert } from './geo-import.repository';

const CHUNK = 1000;

/** État d'une (dernière) ingestion, exposé à l'administration. Purement en mémoire (par instance). */
export interface GeoImportStatus {
  running: boolean;
  country: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  regionsUpserted: number | null;
  municipalitiesInserted: number | null;
  municipalitiesRead: number | null;
  error: string | null;
}

/**
 * Ingestion du référentiel géographique depuis GeoNames (TSPEC.03), déclenchable depuis
 * l'administration. Traitement **batch** exécuté en arrière-plan : l'API répond immédiatement, le
 * front interroge le statut. En cas d'échec (réseau…), **aucune donnée n'est supprimée** — le
 * référentiel existant reste servi (résilience).
 */
@Injectable()
export class GeoImportService {
  private readonly logger = new Logger(GeoImportService.name);
  private status: GeoImportStatus = {
    running: false,
    country: null,
    startedAt: null,
    finishedAt: null,
    regionsUpserted: null,
    municipalitiesInserted: null,
    municipalitiesRead: null,
    error: null,
  };

  constructor(private readonly repository: GeoImportRepository) {}

  /** Démarre une ingestion en arrière-plan (rejette si une ingestion est déjà en cours). */
  start(country: string, baseUrl?: string): GeoImportStatus {
    if (this.status.running) {
      throw new ConflictException('Une ingestion GeoNames est déjà en cours.');
    }
    const code = country.trim().toUpperCase();
    this.status = {
      running: true,
      country: code,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      regionsUpserted: null,
      municipalitiesInserted: null,
      municipalitiesRead: null,
      error: null,
    };
    // Fire-and-forget : le contrôleur répond tout de suite ; le front suit via getStatus().
    void this.run(code, baseUrl ?? GEONAMES_DEFAULT_BASE_URL);
    return this.status;
  }

  async getStatus(): Promise<GeoImportStatus & { counts: GeoCounts }> {
    return { ...this.status, counts: await this.repository.counts() };
  }

  private async run(country: string, baseUrl: string): Promise<void> {
    try {
      const rows = await fetchGeoNamesRows(country, baseUrl);
      if (rows.length === 0) {
        throw new Error('Aucune ligne exploitable dans la source GeoNames.');
      }
      const countryId = await this.repository.upsertCountry(country, countryNameFor(country));
      const regionIdByName = await this.upsertRegions(countryId, rows);
      const inserted = await this.insertMunicipalities(rows, regionIdByName);

      this.status = {
        ...this.status,
        running: false,
        finishedAt: new Date().toISOString(),
        regionsUpserted: regionIdByName.size,
        municipalitiesInserted: inserted,
        municipalitiesRead: rows.length,
        error: null,
      };
      this.logger.log(
        `Ingestion GeoNames ${country} : ${regionIdByName.size} régions, ${inserted} communes ajoutées.`,
      );
    } catch (error) {
      // Résilience : on ne supprime rien ; on journalise l'échec dans le statut.
      this.status = {
        ...this.status,
        running: false,
        finishedAt: new Date().toISOString(),
        error: (error as Error).message,
      };
      this.logger.warn(`Ingestion GeoNames ${country} échouée : ${(error as Error).message}`);
    }
  }

  private async upsertRegions(countryId: string, rows: GeoRow[]): Promise<Map<string, string>> {
    const regionCodeByName = new Map<string, string | null>();
    for (const row of rows) {
      if (!regionCodeByName.has(row.regionName)) {
        regionCodeByName.set(row.regionName, row.regionCode);
      }
    }
    const regionIdByName = new Map<string, string>();
    for (const [name, code] of regionCodeByName) {
      regionIdByName.set(name, await this.repository.upsertRegion(countryId, name, code));
    }
    return regionIdByName;
  }

  private async insertMunicipalities(
    rows: GeoRow[],
    regionIdByName: Map<string, string>,
  ): Promise<number> {
    const seen = new Set<string>();
    const data: MunicipalityInsert[] = [];
    for (const row of rows) {
      const regionId = regionIdByName.get(row.regionName);
      if (!regionId) {
        continue;
      }
      const key = `${regionId}|${row.place}|${row.postalCode}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      data.push({
        name: row.place,
        regionId,
        postalCode: row.postalCode,
        latitude: row.latitude,
        longitude: row.longitude,
      });
    }
    let inserted = 0;
    for (let i = 0; i < data.length; i += CHUNK) {
      inserted += await this.repository.insertMunicipalities(data.slice(i, i + CHUNK));
    }
    return inserted;
  }
}

import { gunzipSync, inflateRawSync } from 'node:zlib';

/**
 * Fonctions **pures** d'ingestion GeoNames (aucune dépendance Nest/Prisma), partagées par le
 * service backend et le script CLI (`scripts/import-geonames.ts`). GeoNames = source du référentiel
 * géographique local (TSPEC.03) ; le runtime n'appelle jamais GeoNames en ligne.
 */

export const GEONAMES_DEFAULT_BASE_URL = 'https://download.geonames.org/export/zip';

/** Noms FR des pays pour les codes ISO 3166-1 alpha-2 courants (le dump postal ne porte que le code). */
export const COUNTRY_NAMES: Record<string, string> = {
  FR: 'France', BE: 'Belgique', CH: 'Suisse', LU: 'Luxembourg', DE: 'Allemagne',
  ES: 'Espagne', IT: 'Italie', PT: 'Portugal', GB: 'Royaume-Uni', IE: 'Irlande',
  NL: 'Pays-Bas', AT: 'Autriche', US: 'États-Unis', CA: 'Canada', MC: 'Monaco',
};

export function countryNameFor(code: string, override?: string): string {
  return override ?? COUNTRY_NAMES[code] ?? code;
}

/** Une ligne GeoNames exploitable (code postal → commune, avec région et coordonnées). */
export interface GeoRow {
  place: string;
  postalCode: string;
  regionName: string;
  regionCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

/** Extrait une entrée d'une archive ZIP (méthode « stored » ou « deflate ») sans dépendance externe. */
export function extractZipEntry(buffer: Buffer, nameEndsWith: string): Buffer {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error('Archive ZIP invalide (fin de répertoire central introuvable).');
  }
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let ptr = buffer.readUInt32LE(eocd + 16);
  for (let n = 0; n < entryCount; n += 1) {
    if (buffer.readUInt32LE(ptr) !== 0x02014b50) {
      throw new Error('Répertoire central ZIP corrompu.');
    }
    const method = buffer.readUInt16LE(ptr + 10);
    const compSize = buffer.readUInt32LE(ptr + 20);
    const nameLen = buffer.readUInt16LE(ptr + 28);
    const extraLen = buffer.readUInt16LE(ptr + 30);
    const commentLen = buffer.readUInt16LE(ptr + 32);
    const localOffset = buffer.readUInt32LE(ptr + 42);
    const name = buffer.toString('utf8', ptr + 46, ptr + 46 + nameLen);
    if (name.endsWith(nameEndsWith)) {
      const lhNameLen = buffer.readUInt16LE(localOffset + 26);
      const lhExtraLen = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
      const compressed = buffer.subarray(dataStart, dataStart + compSize);
      return method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed);
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`Entrée « ${nameEndsWith} » absente de l'archive.`);
}

/** Renvoie le TSV brut à partir d'un buffer .txt / .gz / .zip (détection par nom de source). */
export function readTsv(buffer: Buffer, source: string, country: string): string {
  if (source.endsWith('.zip')) {
    return extractZipEntry(buffer, `${country}.txt`).toString('utf8');
  }
  if (source.endsWith('.gz')) {
    return gunzipSync(buffer).toString('utf8');
  }
  return buffer.toString('utf8');
}

/** Parse un TSV GeoNames (codes postaux) en lignes exploitables (ignore les lignes incomplètes). */
export function parseRows(tsv: string, limit?: number): GeoRow[] {
  const rows: GeoRow[] = [];
  for (const line of tsv.split('\n')) {
    if (!line.trim()) {
      continue;
    }
    const c = line.split('\t');
    const place = (c[2] ?? '').trim();
    const postalCode = (c[1] ?? '').trim();
    if (!place || !postalCode) {
      continue;
    }
    rows.push({
      place,
      postalCode,
      regionName: (c[3] ?? '').trim() || '(Région non renseignée)',
      regionCode: (c[4] ?? '').trim() || null,
      latitude: c[9] ? Number(c[9]) : null,
      longitude: c[10] ? Number(c[10]) : null,
    });
    if (limit && rows.length >= limit) {
      break;
    }
  }
  return rows;
}

/** Télécharge le dump `{CC}.zip` depuis GeoNames et renvoie les lignes exploitables. */
export async function fetchGeoNamesRows(
  country: string,
  baseUrl = GEONAMES_DEFAULT_BASE_URL,
  limit?: number,
): Promise<GeoRow[]> {
  const url = `${baseUrl}/${country}.zip`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Téléchargement GeoNames échoué (${response.status}) sur ${url}.`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return parseRows(readTsv(buffer, url, country), limit);
}

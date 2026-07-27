/**
 * Ingestion du référentiel géographique local depuis **GeoNames** (TSPEC.03).
 *
 * Objectif : alimenter les tables Country / Region / Municipality à partir du jeu de données
 * **codes postaux** de GeoNames (https://download.geonames.org/export/zip/), afin que le runtime
 * n'ait **jamais** de dépendance à GeoNames (résilience à une indisponibilité). Une fois importées,
 * les communes vivent dans PostgreSQL et la résolution « pays + code postal → commune(s) » est
 * purement locale.
 *
 * Source (TSV, une ligne par code postal), colonnes GeoNames :
 *   0 country code · 1 postal code · 2 place name · 3 admin name1 · 4 admin code1 ·
 *   5 admin name2 · 6 admin code2 · 7 admin name3 · 8 admin code3 · 9 latitude · 10 longitude · 11 accuracy
 *
 * Mapping : country code → Country ; admin name1/code1 → Region ; place name + postal code +
 * lat/long → Municipality. Idempotent (unicité (region, name, postalCode)).
 *
 * Usage :
 *   npm run geonames:import -- --file ./data/FR.txt            # fichier .txt / .zip / .gz déjà téléchargé
 *   npm run geonames:import -- --country FR --download          # télécharge FR.zip depuis GeoNames
 *   npm run geonames:import -- --country BE --download --country-name "Belgique"
 *   options : --limit N (test), --base-url <url>, --country-name <nom>
 *
 * Résilience : le téléchargement est un traitement **batch** hors ligne du runtime. En cas d'échec
 * réseau, le référentiel déjà présent en base est conservé intact (aucune suppression).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync, inflateRawSync } from 'node:zlib';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEFAULT_BASE_URL = process.env.GEONAMES_BASE_URL ?? 'https://download.geonames.org/export/zip';
const CACHE_DIR = join(__dirname, '.cache');
const CHUNK = 1000;

// Noms de pays FR pour les codes ISO 3166-1 alpha-2 courants (le dump postal ne porte que le code).
// Repli : le code lui-même. Surchargeable via --country-name.
const COUNTRY_NAMES: Record<string, string> = {
  FR: 'France', BE: 'Belgique', CH: 'Suisse', LU: 'Luxembourg', DE: 'Allemagne',
  ES: 'Espagne', IT: 'Italie', PT: 'Portugal', GB: 'Royaume-Uni', IE: 'Irlande',
  NL: 'Pays-Bas', AT: 'Autriche', US: 'États-Unis', CA: 'Canada', MC: 'Monaco',
};

interface Args {
  country: string;
  file?: string;
  download: boolean;
  countryName?: string;
  baseUrl: string;
  limit?: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { country: 'FR', download: false, baseUrl: DEFAULT_BASE_URL };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = (): string => argv[++i];
    switch (arg) {
      case '--country': args.country = next().toUpperCase(); break;
      case '--file': args.file = next(); break;
      case '--download': args.download = true; break;
      case '--country-name': args.countryName = next(); break;
      case '--base-url': args.baseUrl = next(); break;
      case '--limit': args.limit = Number(next()); break;
      default:
        if (arg.startsWith('--')) {
          throw new Error(`Option inconnue : ${arg}`);
        }
    }
  }
  return args;
}

/** Extrait une entrée d'une archive ZIP (méthode « stored » ou « deflate ») sans dépendance externe. */
function extractZipEntry(buffer: Buffer, nameEndsWith: string): Buffer {
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

/** Renvoie le contenu TSV brut à partir d'un buffer .txt / .gz / .zip (détection par nom). */
function readTsv(buffer: Buffer, source: string, country: string): string {
  if (source.endsWith('.zip')) {
    return extractZipEntry(buffer, `${country}.txt`).toString('utf8');
  }
  if (source.endsWith('.gz')) {
    return gunzipSync(buffer).toString('utf8');
  }
  return buffer.toString('utf8');
}

async function loadSource(args: Args): Promise<string> {
  if (args.file) {
    if (!existsSync(args.file)) {
      throw new Error(`Fichier introuvable : ${args.file}`);
    }
    return readTsv(readFileSync(args.file), args.file, args.country);
  }
  if (args.download) {
    const url = `${args.baseUrl}/${args.country}.zip`;
    console.log(`Téléchargement de ${url} …`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Téléchargement GeoNames échoué (${response.status}). Le référentiel local est conservé.`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    // Cache local : évite de re-télécharger et sert de repli hors ligne.
    mkdirSync(CACHE_DIR, { recursive: true });
    const cachePath = join(CACHE_DIR, `${args.country}.zip`);
    writeFileSync(cachePath, buffer);
    return readTsv(buffer, url, args.country);
  }
  throw new Error('Indiquez une source : --file <chemin> ou --download.');
}

interface Row {
  place: string;
  postalCode: string;
  regionName: string;
  regionCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

function parseRows(tsv: string, limit?: number): Row[] {
  const rows: Row[] = [];
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const countryName = args.countryName ?? COUNTRY_NAMES[args.country] ?? args.country;

  const tsv = await loadSource(args);
  const rows = parseRows(tsv, args.limit);
  if (rows.length === 0) {
    throw new Error('Aucune ligne exploitable dans la source GeoNames.');
  }
  console.log(`${rows.length} lignes GeoNames pour ${args.country} (${countryName}).`);

  // 1) Pays (upsert par code ISO).
  const country = await prisma.country.upsert({
    where: { code: args.country },
    update: { name: countryName },
    create: { code: args.country, name: countryName },
  });

  // 2) Régions (admin name1) — peu nombreuses, upsert par (countryId, name).
  const regionNames = new Map<string, string | null>();
  for (const row of rows) {
    if (!regionNames.has(row.regionName)) {
      regionNames.set(row.regionName, row.regionCode);
    }
  }
  const regionIdByName = new Map<string, string>();
  for (const [name, code] of regionNames) {
    const region = await prisma.region.upsert({
      where: { countryId_name: { countryId: country.id, name } },
      update: { code: code ?? undefined },
      create: { name, code, countryId: country.id },
    });
    regionIdByName.set(name, region.id);
  }
  console.log(`${regionIdByName.size} régions.`);

  // 3) Communes — insertion en lot (skipDuplicates : idempotent sur (region, name, postalCode)).
  const seen = new Set<string>();
  const data: { name: string; regionId: string; postalCode: string; latitude: number | null; longitude: number | null }[] = [];
  for (const row of rows) {
    const regionId = regionIdByName.get(row.regionName)!;
    const key = `${regionId}|${row.place}|${row.postalCode}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    data.push({ name: row.place, regionId, postalCode: row.postalCode, latitude: row.latitude, longitude: row.longitude });
  }

  let inserted = 0;
  for (let i = 0; i < data.length; i += CHUNK) {
    const batch = data.slice(i, i + CHUNK);
    const result = await prisma.municipality.createMany({ data: batch, skipDuplicates: true });
    inserted += result.count;
  }
  console.log(`Communes : ${data.length} distinctes, ${inserted} nouvelles insérées (les existantes sont conservées).`);
  console.log('Import GeoNames terminé — référentiel local à jour.');
}

main()
  .catch((error) => {
    console.error(`Import GeoNames échoué : ${(error as Error).message}`);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

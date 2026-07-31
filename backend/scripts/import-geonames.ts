/**
 * Ingestion CLI du référentiel géographique local depuis **GeoNames** (TSPEC.03).
 *
 * Alimente Country / Region / Municipality à partir du jeu de données *codes postaux* de GeoNames,
 * afin que le runtime n'ait **jamais** de dépendance à GeoNames (résilience). La même logique de
 * parsing est exposée au backend (déclenchement depuis l'administration) via `geonames.util.ts`.
 *
 * Usage :
 *   npm run geonames:import -- --file ./FR.txt            # fichier .txt / .zip / .gz déjà téléchargé
 *   npm run geonames:import -- --country FR --download     # télécharge FR.zip depuis GeoNames
 *   npm run geonames:import -- --country BE --download --country-name "Belgique"
 *   options : --limit N (test), --base-url <url>, --country-name <nom>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  countryNameFor,
  GEONAMES_DEFAULT_BASE_URL,
  parseRows,
  readTsv,
  type GeoRow,
} from '../src/reference-data/geo-import/geonames.util';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const CACHE_DIR = join(__dirname, '.cache');
const CHUNK = 1000;

interface Args {
  country: string;
  file?: string;
  download: boolean;
  countryName?: string;
  baseUrl: string;
  limit?: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    country: 'FR',
    download: false,
    baseUrl: process.env.GEONAMES_BASE_URL ?? GEONAMES_DEFAULT_BASE_URL,
  };
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

async function loadRows(args: Args): Promise<GeoRow[]> {
  if (args.file) {
    if (!existsSync(args.file)) {
      throw new Error(`Fichier introuvable : ${args.file}`);
    }
    return parseRows(readTsv(readFileSync(args.file), args.file, args.country), args.limit);
  }
  if (args.download) {
    const url = `${args.baseUrl}/${args.country}.zip`;
    console.log(`Téléchargement de ${url} …`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Téléchargement GeoNames échoué (${response.status}). Le référentiel local est conservé.`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    // Cache local (repli hors ligne, évite de re-télécharger).
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(join(CACHE_DIR, `${args.country}.zip`), buffer);
    return parseRows(readTsv(buffer, url, args.country), args.limit);
  }
  throw new Error('Indiquez une source : --file <chemin> ou --download.');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const countryName = countryNameFor(args.country, args.countryName);

  const rows = await loadRows(args);
  if (rows.length === 0) {
    throw new Error('Aucune ligne exploitable dans la source GeoNames.');
  }
  console.log(`${rows.length} lignes GeoNames pour ${args.country} (${countryName}).`);

  const country = await prisma.country.upsert({
    where: { code: args.country },
    update: { name: countryName },
    create: { code: args.country, name: countryName },
  });

  // Régions (admin name1) — peu nombreuses, upsert par (countryId, name).
  const regionCodeByName = new Map<string, string | null>();
  for (const row of rows) {
    if (!regionCodeByName.has(row.regionName)) {
      regionCodeByName.set(row.regionName, row.regionCode);
    }
  }
  const regionIdByName = new Map<string, string>();
  for (const [name, code] of regionCodeByName) {
    const region = await prisma.region.upsert({
      where: { countryId_name: { countryId: country.id, name } },
      update: { code: code ?? undefined },
      create: { name, code, countryId: country.id },
    });
    regionIdByName.set(name, region.id);
  }
  console.log(`${regionIdByName.size} régions.`);

  // Communes — insertion en lot (skipDuplicates : idempotent sur (region, name, postalCode)).
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
    const result = await prisma.municipality.createMany({ data: data.slice(i, i + CHUNK), skipDuplicates: true });
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

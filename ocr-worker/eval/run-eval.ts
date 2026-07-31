/**
 * Banc d'évaluation OCR (TSPEC.04, hors pipeline). Exécute le prétraitement + Tesseract sur
 * un dossier d'affiches et mesure, par image, la confiance et le rappel de mots-clés attendus.
 * Aucun accès base/backend : instancie directement les classes du worker.
 *
 *   npm run eval --workspace ocr-worker [-- <dossier>]
 *
 * Format attendu : un fichier `fixtures.json` dans le dossier, associant chaque image à la
 * liste des mots-clés qui devraient apparaître, p. ex. :
 *   { "affiche1.jpg": ["tournoi", "magic", "samedi", "la boutique"] }
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { SharpImageProcessor } from '../src/processing/sharp-image-processor';
import { OcrPostProcessor } from '../src/processing/ocr-post-processor';
import { TesseractOcrEngine } from '../src/engine/tesseract-ocr-engine';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff']);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

async function main(): Promise<void> {
  const dir = process.argv[2] ?? join(__dirname, 'fixtures');
  if (!existsSync(dir)) {
    console.error(`Dossier introuvable : ${dir}`);
    process.exit(1);
  }

  const expected: Record<string, string[]> = existsSync(join(dir, 'fixtures.json'))
    ? JSON.parse(readFileSync(join(dir, 'fixtures.json'), 'utf8'))
    : {};

  const images = readdirSync(dir).filter((f) => IMAGE_EXTENSIONS.has(extname(f).toLowerCase()));
  if (images.length === 0) {
    console.log(`Aucune image dans ${dir}. Déposez des affiches (+ fixtures.json) puis relancez.`);
    return;
  }

  const imageProcessor = new SharpImageProcessor();
  const post = new OcrPostProcessor();
  const engine = new TesseractOcrEngine();

  let totalRecall = 0;
  let recallCount = 0;

  for (const file of images) {
    const buffer = readFileSync(join(dir, file));
    const variants = await imageProcessor.preprocess(buffer);

    let best = { confidence: -1, text: '', label: '' };
    for (const variant of variants) {
      const r = await engine.recognize(variant.buffer);
      if (r.confidence > best.confidence) {
        best = { confidence: r.confidence, text: post.process(r.text), label: variant.label };
      }
    }

    const keywords = expected[file] ?? [];
    const haystack = normalize(best.text);
    const found = keywords.filter((k) => haystack.includes(normalize(k)));
    const recall = keywords.length > 0 ? found.length / keywords.length : NaN;
    if (!Number.isNaN(recall)) {
      totalRecall += recall;
      recallCount += 1;
    }

    console.log(`\n=== ${file} ===`);
    console.log(`variante retenue : ${best.label} | confiance : ${best.confidence.toFixed(2)}`);
    if (keywords.length > 0) {
      console.log(
        `rappel mots-clés : ${found.length}/${keywords.length} ` +
          `(${(recall * 100).toFixed(0)}%) — manquants : ${keywords
            .filter((k) => !found.includes(k))
            .join(', ') || 'aucun'}`,
      );
    }
    console.log(`texte (extrait) : ${best.text.slice(0, 200).replace(/\n/g, ' ⏎ ')}`);
  }

  if (recallCount > 0) {
    console.log(`\n>>> Rappel moyen : ${((totalRecall / recallCount) * 100).toFixed(1)}% sur ${recallCount} image(s).`);
  }

  await engine.onModuleDestroy();
}

void main();

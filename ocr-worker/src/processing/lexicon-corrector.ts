/**
 * Correction lexicale post-OCR (levier 3). Rapproche les mots océrisés proches d'un terme des
 * référentiels (activités, organisateurs, lieux, villes, alias…), afin de fiabiliser la
 * reconnaissance des noms métier. Entièrement déterministe et piloté par les référentiels —
 * aucune liste métier codée en dur (règle d'or 1).
 *
 * Conservateur par construction : ne corrige que les tokens suffisamment longs, proches d'un
 * unique terme du lexique (distance d'édition bornée) et non déjà présents dans le lexique.
 */

export interface CorrectionResult {
  text: string;
  corrections: number;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Distance de Levenshtein bornée : retourne max+1 dès que le seuil est dépassé. */
function boundedLevenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) {
    return max + 1;
  }
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) {
      return max + 1;
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Reproduit la casse du token d'origine sur le mot de remplacement. */
function applyCase(source: string, replacement: string): string {
  if (source === source.toUpperCase() && source !== source.toLowerCase()) {
    return replacement.toUpperCase();
  }
  if (source[0] === source[0]?.toUpperCase() && source.slice(1) === source.slice(1).toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

interface LexiconIndex {
  known: Set<string>;
  byFirstChar: Map<string, { word: string; norm: string }[]>;
}

function buildIndex(words: string[]): LexiconIndex {
  const known = new Set<string>();
  const byFirstChar = new Map<string, { word: string; norm: string }[]>();
  for (const word of words) {
    const norm = normalize(word);
    if (norm.length < 2) continue;
    known.add(norm);
    const key = norm[0];
    const bucket = byFirstChar.get(key) ?? [];
    bucket.push({ word, norm });
    byFirstChar.set(key, bucket);
  }
  return { known, byFirstChar };
}

const MIN_TOKEN_LENGTH = 4;

function thresholdFor(length: number): number {
  return length >= 7 ? 2 : 1;
}

/**
 * Applique la correction lexicale au texte. Découpe en tokens de mots (lettres/chiffres,
 * apostrophes/traits d'union internes) tout en conservant les séparateurs.
 */
export function correctWithLexicon(text: string, words: string[]): CorrectionResult {
  const index = buildIndex(words);
  if (index.known.size === 0) {
    return { text, corrections: 0 };
  }

  let corrections = 0;
  const corrected = text.replace(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu, (token) => {
    if (token.length < MIN_TOKEN_LENGTH) {
      return token;
    }
    const norm = normalize(token);
    if (index.known.has(norm)) {
      return token; // déjà un terme du lexique
    }
    const max = thresholdFor(norm.length);
    const candidates = index.byFirstChar.get(norm[0]) ?? [];

    let best: { word: string; distance: number } | null = null;
    let ambiguous = false;
    for (const candidate of candidates) {
      const distance = boundedLevenshtein(norm, candidate.norm, max);
      if (distance > max) continue;
      if (!best || distance < best.distance) {
        best = { word: candidate.word, distance };
        ambiguous = false;
      } else if (distance === best.distance && candidate.word !== best.word) {
        ambiguous = true;
      }
    }

    if (best && !ambiguous && best.distance >= 1) {
      corrections += 1;
      return applyCase(token, best.word);
    }
    return token;
  });

  return { text: corrected, corrections };
}

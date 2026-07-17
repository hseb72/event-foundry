/** Minuscule + suppression des accents, pour une reconnaissance robuste. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Teste la présence de `needle` comme mot entier dans un texte déjà normalisé.
 * `needle` est normalisé ici.
 */
export function containsWord(normalizedHaystack: string, needle: string): boolean {
  const normalizedNeedle = normalize(needle).trim();
  if (!normalizedNeedle) {
    return false;
  }
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])${escapeRegExp(normalizedNeedle)}([^\\p{L}\\p{N}]|$)`,
    'u',
  );
  return pattern.test(normalizedHaystack);
}

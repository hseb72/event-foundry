/**
 * Minuscule, suppression des accents et **normalisation des espaces**.
 *
 * L'aplatissement des espaces est indispensable sur du texte OCR : une affiche coupe ses libellés
 * en fin de ligne, et « Jeu de\nplateau » ne correspondait alors à aucun libellé du référentiel.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .trim();
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Sépare un libellé normalisé en ses fragments alphanumériques (« yu-gi-oh! » → yu, gi, oh). */
function tokenize(normalized: string): string[] {
  return normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/**
 * Teste la présence de `needle` dans un texte déjà normalisé, en tolérant les variations
 * d'écriture que produisent les affiches et l'OCR :
 *
 * - **ponctuation et espacement libres entre les mots** : « Yu-Gi-Oh! » reconnaît « Yu Gi Oh »,
 *   « Rap/Hip-hop » reconnaît « rap hip hop ». Les fragments doivent rester dans l'ordre et
 *   séparés par au moins un caractère non alphanumérique — « hiphop » ne correspond pas à
 *   « hip-hop », qui serait un autre mot ;
 * - **pluriel** : « Tournoi » reconnaît « Tournois », « Jeu de plateau » reconnaît « Jeux de
 *   plateau ». La marque du pluriel (s/x) est admise après chaque fragment, le français la portant
 *   aussi sur le premier mot d'un libellé composé.
 *
 * La correspondance reste **exacte au mot près** : aucune approximation orthographique, aucune
 * racine tronquée. Une décision métier ne peut pas reposer sur une ressemblance.
 */
export function containsWord(normalizedHaystack: string, needle: string): boolean {
  const tokens = tokenize(normalize(needle));
  if (tokens.length === 0) {
    return false;
  }
  const body = tokens
    .map((token) => `${escapeRegExp(token)}[sx]?`)
    .join('[^\\p{L}\\p{N}]+');
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${body}([^\\p{L}\\p{N}]|$)`, 'u');
  return pattern.test(normalizedHaystack);
}

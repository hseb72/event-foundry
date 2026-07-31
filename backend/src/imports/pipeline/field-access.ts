/**
 * Accès tolérant aux champs d'un payload source (Raw Event) — utilitaires **déterministes** partagés
 * par les étapes Validate / Normalize. Aucune interprétation métier : uniquement de la lecture et de
 * l'harmonisation de format (dates, nombres).
 */

/**
 * Lit la première clé présente et non vide parmi une liste d'alias, en ne considérant que les valeurs
 * **scalaires** (chaîne, nombre, booléen). Les objets/tableaux imbriqués (ex. schema.org `location`,
 * `organizer`) sont ignorés ici — ils relèvent de `readNested`.
 */
export function readField(payload: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (value === null || value === undefined || typeof value === 'object') {
      continue;
    }
    const str = typeof value === 'string' ? value : String(value);
    if (str.trim().length > 0) {
      return str.trim();
    }
  }
  return undefined;
}

/**
 * Lit une valeur imbriquée (ex. schema.org `location.name`, `offers.price`). Traverse les objets ;
 * pour un tableau, prend le premier élément. Renvoie la chaîne trouvée, ou `undefined`.
 */
export function readNested(payload: Record<string, unknown>, path: string[]): string | undefined {
  let current: unknown = payload;
  for (const key of path) {
    if (Array.isArray(current)) {
      current = current[0];
    }
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  if (Array.isArray(current)) {
    current = current[0];
  }
  if (current === null || current === undefined) {
    return undefined;
  }
  const str = typeof current === 'string' ? current : String(current);
  return str.trim().length > 0 ? str.trim() : undefined;
}

/** Convertit une chaîne en ISO 8601 UTC, ou `null` si non parseable. Harmonisation de format seule. */
export function parseDate(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

/** Convertit une chaîne en nombre fini, ou `undefined`. Accepte la virgule décimale. */
export function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const normalized = value.replace(',', '.').replace(/[^0-9.\-]/g, '');
  if (normalized === '') {
    return undefined;
  }
  const num = Number(normalized);
  return Number.isFinite(num) ? num : undefined;
}

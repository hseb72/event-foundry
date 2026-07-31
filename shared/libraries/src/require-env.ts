/**
 * Lit une variable d'environnement **obligatoire** (avec repli sur des noms alternatifs). Échoue de
 * façon explicite si aucune n'est renseignée : aucun secret par défaut n'est jamais codé en dur
 * (ADR.21 — « secrets jamais versionnés, jamais devinables »). À utiliser pour les identifiants de
 * comptes de service, mots de passe et clés.
 */
export function requireEnv(name: string, ...fallbackNames: string[]): string {
  for (const key of [name, ...fallbackNames]) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  const names = [name, ...fallbackNames].join(' / ');
  throw new Error(
    `Variable d'environnement requise absente : ${names}. ` +
      "Aucun secret par défaut n'est fourni (ADR.21) — renseignez-la (ex. via .env ou un secret K8s).",
  );
}

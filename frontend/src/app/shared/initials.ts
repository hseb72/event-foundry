/** Initiales d'affichage (1 à 2 lettres) à partir d'un nom ou d'une adresse e-mail. */
export function toInitials(source: string): string {
  const name = source.split('@')[0].trim();
  if (!name) {
    return '?';
  }
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

import { EventDto } from '../core/models';

/** Dégradés festifs (déclinés de la marque) pour un événement sans image (UISPEC.13). */
const PLACEHOLDERS = [
  'linear-gradient(135deg, #f97316, #ec4899)',
  'linear-gradient(135deg, #8b5cf6, #6366f1)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #6366f1, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
];

/** Événement réduit à ce dont dépend sa couverture — utilisable avec un DTO partiel. */
type CoverSource = Pick<EventDto, 'id'> & Partial<Pick<EventDto, 'coverUrl' | 'media'>>;

/**
 * Valeur CSS `background` de la couverture d'un événement, identique partout (cartes, listes,
 * page de garde, fiche détaillée).
 *
 * L'image vient de `coverUrl`, que **toutes** les vues en liste reçoivent désormais du serveur ;
 * la galerie `media` n'est peuplée que sur la fiche détaillée et sert de repli. Sans aucune image,
 * on retombe sur un dégradé festif **déterministe** (dérivé de l'identifiant) : le même événement
 * garde ainsi la même couleur d'un écran à l'autre.
 */
export function eventCoverBackground(event: CoverSource | null | undefined): string {
  if (!event) {
    return PLACEHOLDERS[0];
  }
  const url =
    event.coverUrl ??
    (event.media?.find((m) => m.contentType?.startsWith('image/')) ?? event.media?.[0])?.url;
  if (url) {
    return `center / cover no-repeat url("${url}")`;
  }
  let hash = 0;
  for (const ch of event.id) hash = (hash + ch.charCodeAt(0)) | 0;
  return PLACEHOLDERS[Math.abs(hash) % PLACEHOLDERS.length];
}

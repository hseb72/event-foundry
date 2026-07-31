import { Injectable } from '@nestjs/common';

// Codes des caractères de contrôle C0 + DEL à supprimer, hors tabulation (9) et
// saut de ligne (10). La classe est construite à l'exécution pour éviter tout
// caractère de contrôle littéral dans la source.
const CONTROL_CODES = Array.from({ length: 32 }, (_, index) => index)
  .filter((code) => code !== 9 && code !== 10)
  .concat(127);
const CONTROL_CHARS = new RegExp(
  `[${CONTROL_CODES.map((code) => String.fromCharCode(code)).join('')}]`,
  'g',
);

/**
 * Nettoyage du texte OCR (TSPEC.04) : normalisation Unicode, homogénéisation des fins de
 * ligne, suppression des espaces superflus et des caractères de contrôle. Aucune
 * interprétation métier.
 */
@Injectable()
export class OcrPostProcessor {
  process(rawText: string): string {
    const cleaned = rawText.normalize('NFC').replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '');

    return cleaned
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

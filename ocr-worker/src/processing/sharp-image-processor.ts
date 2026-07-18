import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import type { ImageProcessor, PreprocessedVariant } from '../interfaces/image-processor.interface';

/**
 * Prétraitement d'image basé sur `sharp` (libvips) — NOTE : implémentation temporaire, on
 * teste `sharp` en premier ; ADR.04 désigne OpenCV pour le traitement d'image (voir la note
 * d'ADR). Objectif : rendre le texte des affiches lisible par Tesseract (TSPEC.04).
 *
 * Produit plusieurs variantes déterministes ; l'OcrProcessor retient la meilleure confiance :
 *  - « grayscale-normalized » : niveaux de gris + upscaling + contraste + débruitage + netteté
 *    (souvent le meilleur pour le moteur LSTM) ;
 *  - « binarized » : la précédente + seuillage (utile sur texte stylisé très contrasté).
 *
 * En cas d'entrée illisible par sharp (ex. PDF non rasterisable), renvoie l'original tel quel
 * pour ne jamais faire échouer le pipeline.
 */
@Injectable()
export class SharpImageProcessor implements ImageProcessor {
  private readonly logger = new Logger(SharpImageProcessor.name);
  /** Largeur cible minimale : en deçà, on agrandit (Tesseract aime ~300 dpi / texte grand). */
  private readonly minWidth = Number(process.env.OCR_MIN_WIDTH ?? '1500');
  private readonly threshold = Number(process.env.OCR_BINARIZE_THRESHOLD ?? '140');

  async preprocess(input: Buffer): Promise<PreprocessedVariant[]> {
    try {
      const metadata = await sharp(input, { failOn: 'none' }).metadata();
      const width = metadata.width ?? 0;
      const targetWidth = width > 0 && width < this.minWidth ? this.minWidth : width || undefined;

      let base = sharp(input, { failOn: 'none' }).rotate(); // auto-orientation via EXIF
      if (targetWidth && targetWidth !== width) {
        base = base.resize({ width: targetWidth, withoutEnlargement: false });
      }

      const grayscale = await base
        .clone()
        .grayscale()
        .normalize() // étirement de contraste
        .median(1) // débruitage léger
        .sharpen()
        .png()
        .toBuffer();

      const binarized = await sharp(grayscale).threshold(this.threshold).png().toBuffer();

      return [
        { label: 'grayscale-normalized', buffer: grayscale },
        { label: 'binarized', buffer: binarized },
      ];
    } catch (error) {
      this.logger.warn(
        `Prétraitement sharp impossible (${messageOf(error)}) : OCR sur l'original.`,
      );
      return [{ label: 'original', buffer: input }];
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

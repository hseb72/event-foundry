import { Injectable } from '@nestjs/common';
import type { ImageProcessor } from '../interfaces/image-processor.interface';

/**
 * Implémentation par défaut sans transformation.
 *
 * TODO(ADR.04) : remplacer par un prétraitement OpenCV (grayscale, deskew, contraste,
 * binarisation, réduction du bruit) — TSPEC.04. Cette abstraction permet le remplacement
 * sans impacter le reste du worker (ADR.07).
 */
@Injectable()
export class PassthroughImageProcessor implements ImageProcessor {
  async preprocess(input: Buffer): Promise<Buffer> {
    return input;
  }
}

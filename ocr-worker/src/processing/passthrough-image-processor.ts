import { Injectable } from '@nestjs/common';
import type { ImageProcessor, PreprocessedVariant } from '../interfaces/image-processor.interface';

/**
 * Implémentation neutre (sans transformation), conservée comme repli et pour les tests.
 * En production, le worker est câblé sur SharpImageProcessor (voir ocr.module.ts).
 */
@Injectable()
export class PassthroughImageProcessor implements ImageProcessor {
  async preprocess(input: Buffer): Promise<PreprocessedVariant[]> {
    return [{ label: 'original', buffer: input }];
  }
}

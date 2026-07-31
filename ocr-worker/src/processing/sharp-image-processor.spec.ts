import sharp from 'sharp';
import { SharpImageProcessor } from './sharp-image-processor';

/** Génère une petite image PNG synthétique (dégradé) pour exercer le prétraitement. */
async function samplePng(): Promise<Buffer> {
  return sharp({
    create: { width: 400, height: 200, channels: 3, background: { r: 200, g: 200, b: 200 } },
  })
    .png()
    .toBuffer();
}

describe('SharpImageProcessor', () => {
  const processor = new SharpImageProcessor();

  it('produit des variantes prétraitées (PNG valides, agrandies)', async () => {
    const variants = await processor.preprocess(await samplePng());

    expect(variants.map((v) => v.label)).toEqual(['grayscale-normalized', 'binarized']);
    for (const variant of variants) {
      const meta = await sharp(variant.buffer).metadata();
      expect(meta.format).toBe('png');
      // upscaling appliqué (largeur cible par défaut = 1500 > 400).
      expect(meta.width).toBeGreaterThanOrEqual(1000);
    }
  });

  it("renvoie l'original si l'entrée n'est pas une image lisible", async () => {
    const variants = await processor.preprocess(Buffer.from('ceci n’est pas une image'));
    expect(variants).toHaveLength(1);
    expect(variants[0].label).toBe('original');
  });
});

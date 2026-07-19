import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createWorker, OEM, PSM, type Worker as TesseractWorker } from 'tesseract.js';
import type { OcrEngine, OcrEngineResult } from '../interfaces/ocr-engine.interface';

/**
 * URL des modèles Tesseract selon la variante.
 *
 * Les modèles **flottants** (« best » ET « standard »/`4.0.0`) importent la fonction
 * `DotProductSSE`. Seul le core WASM « relaxedsimd » de tesseract.js 7 la fournit ; les autres
 * cores (simd, baseline…) ne la fournissent pas. Or le thread *worker* de tesseract.js peut
 * charger un core sans cette fonction selon la plateforme (constaté sous WSL2/Node 22) → crash
 * `Aborted(missing function _ZN9tesseract13DotProductSSEEPKfS1_i)`.
 *
 * Les modèles **entiers** (« fast », et les modèles système Debian) n'appellent jamais
 * `DotProductSSE` : ils fonctionnent sur **tous** les cores. On les prend donc par défaut, et on
 * bascule « best »/« standard » vers « fast ». Un modèle flottant reste utilisable uniquement en
 * pointant explicitement `OCR_LANG_PATH` vers des modèles locaux compatibles.
 */
function tessdataUrl(variant: string | undefined, logger: Logger): string {
  const base = 'https://tessdata.projectnaptha.com/4.0.0';
  if (variant === 'best' || variant === 'standard') {
    logger.warn(
      `OCR_TESSDATA=${variant} utilise des modèles flottants qui importent DotProductSSE et ` +
        'crashent (Aborted) sur les cores WASM sans cette fonction : bascule automatique sur ' +
        'les modèles entiers « fast », sûrs sur tous les cores.',
    );
  }
  return `${base}_fast`;
}

/**
 * Moteur OCR Tesseract (via tesseract.js). Le worker est créé paresseusement, réglé, réutilisé
 * entre les Jobs, puis terminé à l'arrêt. Réglages (TSPEC.04) :
 *  - OEM LSTM et modèles « fast » (entiers) : sûrs sur tous les cores WASM (voir `tessdataUrl`) ;
 *  - PSM adapté aux affiches (texte épars par défaut) ;
 *  - `preserve_interword_spaces` pour ne pas coller les mots.
 * Tout est surchargeable par variables d'environnement.
 *
 * Note : l'apport des référentiels (levier 3) se fait par **correction lexicale post-OCR**
 * (voir OcrProcessor / LexiconCorrector), et non par `user_words` Tesseract : cette dernière
 * voie est instable avec le core WASM et n'apporte quasiment rien au moteur LSTM.
 */
@Injectable()
export class TesseractOcrEngine implements OcrEngine, OnModuleDestroy {
  private readonly logger = new Logger(TesseractOcrEngine.name);
  private worker: TesseractWorker | null = null;
  private readonly languages = process.env.OCR_LANGUAGES ?? 'eng';
  private readonly oem = Number(process.env.OCR_OEM ?? OEM.LSTM_ONLY);
  private readonly psm = (process.env.OCR_PSM ?? PSM.SPARSE_TEXT) as PSM;
  // Modèles « fast » (entiers) par défaut : sûrs sur tous les cores WASM de tesseract.js.
  private readonly langPath =
    process.env.OCR_LANG_PATH ?? tessdataUrl(process.env.OCR_TESSDATA, this.logger);
  // Modèles distants (CDN) = .traineddata.gz ; modèles locaux (paquet système) = non gzippés.
  private readonly gzip = process.env.OCR_LANG_GZIP !== 'false';

  private async getWorker(): Promise<TesseractWorker> {
    if (!this.worker) {
      this.logger.log(`Chargement Tesseract langues=${this.languages} depuis ${this.langPath}`);
      this.worker = await createWorker(this.languages, this.oem, {
        langPath: this.langPath,
        gzip: this.gzip,
      });
      await this.worker.setParameters({
        tessedit_pageseg_mode: this.psm,
        preserve_interword_spaces: '1',
      });
    }
    return this.worker;
  }

  async recognize(image: Buffer): Promise<OcrEngineResult> {
    const worker = await this.getWorker();
    const { data } = await worker.recognize(image);
    return {
      text: data.text,
      confidence: Math.max(0, Math.min(1, data.confidence / 100)),
      language: this.languages,
      engine: 'tesseract',
      engineVersion: 'tesseract.js@7',
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

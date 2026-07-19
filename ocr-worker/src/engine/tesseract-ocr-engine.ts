import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createWorker, OEM, PSM, type Worker as TesseractWorker } from 'tesseract.js';
import type { OcrEngine, OcrEngineResult } from '../interfaces/ocr-engine.interface';

/**
 * URL des modèles Tesseract (CDN projectnaptha) selon la variante demandée :
 *  - « best »     → modèles flottants, les plus précis (plus lourds/lents) ;
 *  - « standard » → modèles par défaut (`4.0.0`) ;
 *  - « fast »     → modèles entiers, les plus légers/rapides.
 *
 * On reste sur **tesseract.js 6** : sa sélection de core WASM (`getCore`) ne dépend que du
 * support **SIMD** et charge `tesseract-core-simd-lstm`. La version 7 a introduit un core
 * « relaxedsimd-lstm » dont le build est cassé (la fonction `DotProductSSE` y est un *stub* qui
 * abort) ; sur un CPU exposant relaxed-SIMD (constaté sous WSL2/Node 22), tesseract.js 7
 * sélectionne ce core et crashe `Aborted(missing function DotProductSSE)`. Le core `simd-lstm`
 * de la v6 ne référence jamais ce symbole : toutes les variantes de modèles fonctionnent.
 */
function tessdataUrl(variant: string | undefined): string {
  const base = 'https://tessdata.projectnaptha.com/4.0.0';
  if (variant === 'fast') return `${base}_fast`;
  if (variant === 'best') return `${base}_best`;
  return base;
}

/**
 * Moteur OCR Tesseract (via tesseract.js 6). Le worker est créé paresseusement, réglé, réutilisé
 * entre les Jobs, puis terminé à l'arrêt. Réglages (TSPEC.04) :
 *  - OEM LSTM et modèles « standard » par défaut (« best » possible pour plus de précision) ;
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
  // Modèles « standard » par défaut ; « best »/« fast » via OCR_TESSDATA. Core v6 = simd-lstm.
  private readonly langPath = process.env.OCR_LANG_PATH ?? tessdataUrl(process.env.OCR_TESSDATA);
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
      engineVersion: 'tesseract.js@6',
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

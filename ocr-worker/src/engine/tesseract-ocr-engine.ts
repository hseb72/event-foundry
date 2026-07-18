import { Inject, Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { createWorker, OEM, PSM, type Worker as TesseractWorker } from 'tesseract.js';
import type { OcrEngine, OcrEngineResult } from '../interfaces/ocr-engine.interface';
import {
  OCR_LEXICON_PROVIDER,
  type ReferenceLexiconProvider,
} from '../reference/reference-lexicon-provider.interface';

/**
 * Moteur OCR Tesseract (via tesseract.js). Le worker est créé paresseusement, réglé, réutilisé
 * entre les Jobs, puis terminé à l'arrêt. Réglages (TSPEC.04) :
 *  - OEM LSTM et modèles « best » (nettement plus précis que le « fast » par défaut) ;
 *  - PSM adapté aux affiches (texte épars par défaut) ;
 *  - `preserve_interword_spaces` pour ne pas coller les mots ;
 *  - dictionnaire utilisateur alimenté par les référentiels (levier 3) — voir plus bas.
 * Tout est surchargeable par variables d'environnement.
 */
@Injectable()
export class TesseractOcrEngine implements OcrEngine, OnModuleDestroy {
  private readonly logger = new Logger(TesseractOcrEngine.name);
  private worker: TesseractWorker | null = null;
  private readonly languages = process.env.OCR_LANGUAGES ?? 'eng';
  private readonly oem = Number(process.env.OCR_OEM ?? OEM.LSTM_ONLY);
  private readonly psm = (process.env.OCR_PSM ?? PSM.SPARSE_TEXT) as PSM;
  // Modèles « best » par défaut (précision) ; « fast » possible via OCR_TESSDATA=fast.
  private readonly langPath =
    process.env.OCR_LANG_PATH ??
    (process.env.OCR_TESSDATA === 'fast'
      ? 'https://tessdata.projectnaptha.com/4.0.0'
      : 'https://tessdata.projectnaptha.com/4.0.0_best');
  // Modèles distants (CDN) = .traineddata.gz ; modèles locaux (paquet système) = non gzippés.
  private readonly gzip = process.env.OCR_LANG_GZIP !== 'false';
  // Dictionnaire utilisateur issu des référentiels (levier 3), activable/désactivable.
  private readonly userWordsEnabled = process.env.OCR_USER_WORDS !== 'false';

  constructor(
    @Optional() @Inject(OCR_LEXICON_PROVIDER) private readonly lexicon?: ReferenceLexiconProvider,
  ) {}

  private async getWorker(): Promise<TesseractWorker> {
    if (this.worker) {
      return this.worker;
    }
    const worker = await createWorker(this.languages, this.oem, {
      langPath: this.langPath,
      gzip: this.gzip,
    });
    await this.applyUserWords(worker);
    await worker.setParameters({
      tessedit_pageseg_mode: this.psm,
      preserve_interword_spaces: '1',
    });
    this.worker = worker;
    return worker;
  }

  /**
   * Injecte le lexique des référentiels comme dictionnaire utilisateur Tesseract : on écrit un
   * fichier `<lang>.user-words` dans le FS du worker, puis on réinitialise avec
   * `user_words_suffix` (les dawgs sont activés pour que le lexique compte). Purement défensif :
   * toute erreur laisse un worker OCR fonctionnel sans dictionnaire.
   */
  private async applyUserWords(worker: TesseractWorker): Promise<void> {
    if (!this.userWordsEnabled || !this.lexicon) {
      return;
    }
    try {
      const words = await this.lexicon.getWords();
      if (words.length === 0) {
        return;
      }
      const primaryLang = this.languages.split('+')[0];
      await worker.writeText(`${primaryLang}.user-words`, words.join('\n'));
      // user_words_suffix est un paramètre d'initialisation supporté à l'exécution mais absent
      // des types tesseract.js : on cast vers le type attendu par reinitialize.
      const initConfig = {
        user_words_suffix: 'user-words',
        load_system_dawg: '1',
        load_freq_dawg: '1',
      } as unknown as Parameters<TesseractWorker['reinitialize']>[2];
      await worker.reinitialize(this.languages, this.oem, initConfig);
      this.logger.log(`Dictionnaire OCR alimenté par ${words.length} mots des référentiels.`);
    } catch (error) {
      this.logger.warn(
        `Dictionnaire utilisateur non appliqué (OCR standard) : ${(error as Error).message}`,
      );
    }
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

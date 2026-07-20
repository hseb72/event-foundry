import { Injectable } from '@nestjs/common';
import type { OcrAssistant } from '@event-foundry/contracts';
import type { OcrEngine, OcrEngineResult } from '../interfaces/ocr-engine.interface';

/** Jeton d'injection de la fabrique d'assistants OCR IA. */
export const AI_OCR_ENGINE_FACTORY = 'AI_OCR_ENGINE_FACTORY';

const OPENAI_COMPATIBLE_BASE: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  ollama: 'http://localhost:11434/v1',
};

const OCR_PROMPT =
  'Transcris fidèlement TOUT le texte visible de cette image, sans commentaire, sans reformulation.';

/**
 * Moteur OCR assisté par IA (ADR.16, 1er cas d'usage). Implémentation **OpenAI-compatible**
 * (chat completions multimodal) : couvre OpenAI et les passerelles compatibles (ex. Ollama `/v1`).
 * D'autres fournisseurs nécessiteraient leur propre adaptateur. En cas d'erreur/format inattendu,
 * l'appelant (OcrProcessor) **retombe sur l'OCR interne** (RG-AI-06). L'IA n'assiste que
 * l'extraction : la décision métier reste déterministe (classifier).
 */
export class AiOcrEngine implements OcrEngine {
  constructor(private readonly assistant: OcrAssistant) {}

  async recognize(image: Buffer): Promise<OcrEngineResult> {
    const base = OPENAI_COMPATIBLE_BASE[this.assistant.provider] ?? OPENAI_COMPATIBLE_BASE.openai;
    const dataUrl = `data:image/png;base64,${image.toString('base64')}`;
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.assistant.apiKey}`,
      },
      body: JSON.stringify({
        model: this.assistant.model,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: OCR_PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`IA OCR ${this.assistant.provider} a répondu ${response.status}`);
    }
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Réponse IA OCR vide ou inattendue');
    }
    return {
      text,
      confidence: 0.99, // extraction assistée : confiance élevée (la décision reste déterministe).
      language: 'auto',
      engine: `ai:${this.assistant.provider}`,
      engineVersion: this.assistant.model,
    };
  }
}

/** Construit un moteur OCR IA à partir de l'assistant résolu par le Backend (par job). */
@Injectable()
export class AiOcrEngineFactory {
  forAssistant(assistant: OcrAssistant): OcrEngine {
    return new AiOcrEngine(assistant);
  }
}

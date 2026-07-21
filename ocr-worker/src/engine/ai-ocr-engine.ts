import { Injectable } from '@nestjs/common';
import type { OcrAssistant } from '@event-foundry/contracts';
import type { OcrEngine, OcrEngineResult } from '../interfaces/ocr-engine.interface';

/** Jeton d'injection de la fabrique d'assistants OCR IA. */
export const AI_OCR_ENGINE_FACTORY = 'AI_OCR_ENGINE_FACTORY';

type ProviderKind = 'openai-compatible' | 'anthropic' | 'gemini';
interface ProviderConfig {
  kind: ProviderKind;
  baseUrl: string;
  requiresKey: boolean;
}

/** Registre local (worker) : fournisseur → type d'API + URL de base. Aligné sur le catalogue Backend. */
const PROVIDERS: Record<string, ProviderConfig> = {
  openai: { kind: 'openai-compatible', baseUrl: 'https://api.openai.com/v1', requiresKey: true },
  mistral: { kind: 'openai-compatible', baseUrl: 'https://api.mistral.ai/v1', requiresKey: true },
  ollama: { kind: 'openai-compatible', baseUrl: 'http://localhost:11434/v1', requiresKey: false },
  anthropic: { kind: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', requiresKey: true },
  gemini: { kind: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', requiresKey: true },
};

const ANTHROPIC_VERSION = '2023-06-01';
const OCR_PROMPT =
  'Transcris fidèlement TOUT le texte visible de cette image, sans commentaire, sans reformulation.';

/**
 * Moteur OCR assisté par IA (ADR.16, 1er cas d'usage). Trois familles d'API prises en charge :
 * **OpenAI-compatible** (OpenAI, Mistral, Ollama…), **Anthropic** (Claude) et **Gemini**. En cas
 * d'erreur/format inattendu, l'appelant (OcrProcessor) **retombe sur l'OCR interne** (RG-AI-06).
 * L'IA n'assiste que l'extraction : la décision métier reste déterministe (classifier).
 */
export class AiOcrEngine implements OcrEngine {
  private readonly config: ProviderConfig;

  constructor(private readonly assistant: OcrAssistant) {
    this.config = PROVIDERS[assistant.provider] ?? PROVIDERS.openai;
  }

  async recognize(image: Buffer): Promise<OcrEngineResult> {
    const base64 = image.toString('base64');
    const text = await this.extract(base64);
    if (!text.trim()) {
      throw new Error('Réponse IA OCR vide ou inattendue');
    }
    return {
      text,
      confidence: 0.99, // extraction assistée : la décision reste déterministe.
      language: 'auto',
      engine: `ai:${this.assistant.provider}`,
      engineVersion: this.assistant.model,
    };
  }

  private async extract(base64: string): Promise<string> {
    switch (this.config.kind) {
      case 'anthropic':
        return this.viaAnthropic(base64);
      case 'gemini':
        return this.viaGemini(base64);
      case 'openai-compatible':
      default:
        return this.viaOpenAiCompatible(base64);
    }
  }

  private async viaOpenAiCompatible(base64: string): Promise<string> {
    const payload = await this.postJson(`${this.config.baseUrl}/chat/completions`, {
      headers: this.config.requiresKey ? { authorization: `Bearer ${this.assistant.apiKey}` } : {},
      body: {
        model: this.assistant.model,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: OCR_PROMPT },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
            ],
          },
        ],
      },
    });
    return (payload as OpenAiResponse).choices?.[0]?.message?.content ?? '';
  }

  private async viaAnthropic(base64: string): Promise<string> {
    const payload = await this.postJson(`${this.config.baseUrl}/messages`, {
      headers: { 'x-api-key': this.assistant.apiKey, 'anthropic-version': ANTHROPIC_VERSION },
      body: {
        model: this.assistant.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: OCR_PROMPT },
              { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64 } },
            ],
          },
        ],
      },
    });
    const blocks = (payload as AnthropicResponse).content ?? [];
    return blocks.find((block) => block.type === 'text')?.text ?? '';
  }

  private async viaGemini(base64: string): Promise<string> {
    const url = `${this.config.baseUrl}/models/${encodeURIComponent(this.assistant.model)}:generateContent?key=${encodeURIComponent(this.assistant.apiKey)}`;
    const payload = await this.postJson(url, {
      headers: {},
      body: {
        contents: [
          {
            parts: [
              { text: OCR_PROMPT },
              { inline_data: { mime_type: 'image/png', data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0 },
      },
    });
    return (payload as GeminiResponse).candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  private async postJson(
    url: string,
    options: { headers: Record<string, string>; body: unknown },
  ): Promise<unknown> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...options.headers },
      body: JSON.stringify(options.body),
    });
    if (!response.ok) {
      throw new Error(`IA OCR ${this.assistant.provider} a répondu ${response.status}`);
    }
    return response.json();
  }
}

interface OpenAiResponse {
  choices?: { message?: { content?: string } }[];
}
interface AnthropicResponse {
  content?: { type: string; text?: string }[];
}
interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** Construit un moteur OCR IA à partir de l'assistant résolu par le Backend (par job). */
@Injectable()
export class AiOcrEngineFactory {
  forAssistant(assistant: OcrAssistant): OcrEngine {
    return new AiOcrEngine(assistant);
  }
}

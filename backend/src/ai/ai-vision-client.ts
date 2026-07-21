import { Injectable } from '@nestjs/common';
import { findProvider } from './ai-providers';
import type { ResolvedAssistant } from './ai-config.service';

const ANTHROPIC_VERSION = '2023-06-01';
const TIMEOUT_MS = 30000;

/** Image à analyser (extraction assistée par IA — ADR.16). */
export interface VisionImage {
  base64: string;
  mediaType: string;
}

/**
 * Client IA **vision** (extraction — ADR.16 §Frontière) : envoie une image + une consigne et renvoie
 * la réponse texte du modèle (attendue : un JSON de libellés bruts). Trois familles d'API
 * (OpenAI-compatible, Anthropic, Gemini). L'IA extrait ; la décision métier reste déterministe.
 */
@Injectable()
export class AiVisionClient {
  async run(assistant: ResolvedAssistant, prompt: string, image: VisionImage): Promise<string> {
    const provider = findProvider(assistant.provider);
    const kind = provider?.kind ?? 'openai-compatible';
    const baseUrl = provider?.baseUrl ?? 'https://api.openai.com/v1';
    const requiresKey = provider?.requiresKey ?? true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      if (kind === 'anthropic') {
        return await this.viaAnthropic(baseUrl, assistant, prompt, image, controller.signal);
      }
      if (kind === 'gemini') {
        return await this.viaGemini(baseUrl, assistant, prompt, image, controller.signal);
      }
      return await this.viaOpenAiCompatible(baseUrl, requiresKey, assistant, prompt, image, controller.signal);
    } finally {
      clearTimeout(timer);
    }
  }

  private async viaOpenAiCompatible(
    baseUrl: string,
    requiresKey: boolean,
    a: ResolvedAssistant,
    prompt: string,
    image: VisionImage,
    signal: AbortSignal,
  ): Promise<string> {
    const payload = (await this.postJson(`${baseUrl}/chat/completions`, {
      headers: requiresKey ? { authorization: `Bearer ${a.apiKey}` } : {},
      body: {
        model: a.model,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${image.mediaType};base64,${image.base64}` } },
            ],
          },
        ],
      },
      provider: a.provider,
      signal,
    })) as { choices?: { message?: { content?: string } }[] };
    return payload.choices?.[0]?.message?.content?.trim() ?? '';
  }

  private async viaAnthropic(
    baseUrl: string,
    a: ResolvedAssistant,
    prompt: string,
    image: VisionImage,
    signal: AbortSignal,
  ): Promise<string> {
    const payload = (await this.postJson(`${baseUrl}/messages`, {
      headers: { 'x-api-key': a.apiKey, 'anthropic-version': ANTHROPIC_VERSION },
      body: {
        model: a.model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } },
            ],
          },
        ],
      },
      provider: a.provider,
      signal,
    })) as { content?: { type: string; text?: string }[] };
    return (payload.content ?? []).find((b) => b.type === 'text')?.text?.trim() ?? '';
  }

  private async viaGemini(
    baseUrl: string,
    a: ResolvedAssistant,
    prompt: string,
    image: VisionImage,
    signal: AbortSignal,
  ): Promise<string> {
    const url = `${baseUrl}/models/${encodeURIComponent(a.model)}:generateContent?key=${encodeURIComponent(a.apiKey)}`;
    const payload = (await this.postJson(url, {
      headers: {},
      body: {
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: image.mediaType, data: image.base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0 },
      },
      provider: a.provider,
      signal,
    })) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  }

  private async postJson(
    url: string,
    o: { headers: Record<string, string>; body: unknown; provider: string; signal: AbortSignal },
  ): Promise<unknown> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...o.headers },
      body: JSON.stringify(o.body),
      signal: o.signal,
    });
    if (!response.ok) {
      throw new Error(`IA ${o.provider} a répondu ${response.status}`);
    }
    return response.json();
  }
}

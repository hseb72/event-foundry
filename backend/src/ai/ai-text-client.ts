import { Injectable } from '@nestjs/common';
import { findProvider } from './ai-providers';
import type { ResolvedAssistant } from './ai-config.service';

const ANTHROPIC_VERSION = '2023-06-01';
const TIMEOUT_MS = 20000;

/**
 * Client IA **texte** (assistance à l'affichage — ADR.16) : traduction / résumé / reformulation.
 * Trois familles d'API (OpenAI-compatible, Anthropic, Gemini). L'IA n'assiste jamais une décision
 * métier ; le résultat n'est ni persisté ni utilisé comme champ figé.
 */
@Injectable()
export class AiTextClient {
  async run(assistant: ResolvedAssistant, prompt: string): Promise<string> {
    const provider = findProvider(assistant.provider);
    const kind = provider?.kind ?? 'openai-compatible';
    const baseUrl = provider?.baseUrl ?? 'https://api.openai.com/v1';
    const requiresKey = provider?.requiresKey ?? true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      if (kind === 'anthropic') {
        return await this.viaAnthropic(baseUrl, assistant, prompt, controller.signal);
      }
      if (kind === 'gemini') {
        return await this.viaGemini(baseUrl, assistant, prompt, controller.signal);
      }
      return await this.viaOpenAiCompatible(baseUrl, requiresKey, assistant, prompt, controller.signal);
    } finally {
      clearTimeout(timer);
    }
  }

  private async viaOpenAiCompatible(
    baseUrl: string,
    requiresKey: boolean,
    a: ResolvedAssistant,
    prompt: string,
    signal: AbortSignal,
  ): Promise<string> {
    const body = {
      model: a.model,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    };
    const payload = (await this.postJson(`${baseUrl}/chat/completions`, {
      headers: requiresKey ? { authorization: `Bearer ${a.apiKey}` } : {},
      body,
      provider: a.provider,
      signal,
    })) as { choices?: { message?: { content?: string } }[] };
    return payload.choices?.[0]?.message?.content?.trim() ?? '';
  }

  private async viaAnthropic(
    baseUrl: string,
    a: ResolvedAssistant,
    prompt: string,
    signal: AbortSignal,
  ): Promise<string> {
    const payload = (await this.postJson(`${baseUrl}/messages`, {
      headers: { 'x-api-key': a.apiKey, 'anthropic-version': ANTHROPIC_VERSION },
      body: { model: a.model, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] },
      provider: a.provider,
      signal,
    })) as { content?: { type: string; text?: string }[] };
    return (payload.content ?? []).find((b) => b.type === 'text')?.text?.trim() ?? '';
  }

  private async viaGemini(
    baseUrl: string,
    a: ResolvedAssistant,
    prompt: string,
    signal: AbortSignal,
  ): Promise<string> {
    const url = `${baseUrl}/models/${encodeURIComponent(a.model)}:generateContent?key=${encodeURIComponent(a.apiKey)}`;
    const payload = (await this.postJson(url, {
      headers: {},
      body: { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } },
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

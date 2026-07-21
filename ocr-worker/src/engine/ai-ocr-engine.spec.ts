import { AiOcrEngine } from './ai-ocr-engine';

describe('AiOcrEngine (adaptateurs multi-fournisseurs)', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  function mockJson(body: unknown, ok = true) {
    const fn = jest.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) } as Response);
    global.fetch = fn as unknown as typeof fetch;
    return fn;
  }

  it('OpenAI-compatible : POST /chat/completions, extrait le contenu', async () => {
    const fn = mockJson({ choices: [{ message: { content: 'TEXTE OPENAI' } }] });
    const engine = new AiOcrEngine({ provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk' });
    const result = await engine.recognize(Buffer.from('img'));
    expect(fn.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions');
    expect(result.text).toBe('TEXTE OPENAI');
    expect(result.engine).toBe('ai:openai');
  });

  it('Anthropic : POST /messages avec en-têtes, extrait le bloc texte', async () => {
    const fn = mockJson({ content: [{ type: 'text', text: 'TEXTE CLAUDE' }] });
    const engine = new AiOcrEngine({ provider: 'anthropic', model: 'claude-3-5-sonnet-latest', apiKey: 'sk-ant' });
    const result = await engine.recognize(Buffer.from('img'));
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('sk-ant');
    expect(result.text).toBe('TEXTE CLAUDE');
  });

  it('Gemini : clé en query, extrait la 1ʳᵉ part texte', async () => {
    const fn = mockJson({ candidates: [{ content: { parts: [{ text: 'TEXTE GEMINI' }] } }] });
    const engine = new AiOcrEngine({ provider: 'gemini', model: 'gemini-1.5-flash', apiKey: 'AIza' });
    const result = await engine.recognize(Buffer.from('img'));
    expect(fn.mock.calls[0][0]).toContain(':generateContent?key=AIza');
    expect(result.text).toBe('TEXTE GEMINI');
  });

  it('réponse non-OK → exception (l’appelant retombera sur l’OCR interne)', async () => {
    mockJson({}, false);
    const engine = new AiOcrEngine({ provider: 'openai', model: 'gpt-4o', apiKey: 'sk' });
    await expect(engine.recognize(Buffer.from('img'))).rejects.toThrow();
  });

  it('texte vide → exception', async () => {
    mockJson({ choices: [{ message: { content: '   ' } }] });
    const engine = new AiOcrEngine({ provider: 'openai', model: 'gpt-4o', apiKey: 'sk' });
    await expect(engine.recognize(Buffer.from('img'))).rejects.toThrow();
  });
});

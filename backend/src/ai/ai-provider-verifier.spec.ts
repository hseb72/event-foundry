import { AiProviderVerifier } from './ai-provider-verifier';

describe('AiProviderVerifier (test de connexion réel)', () => {
  let verifier: AiProviderVerifier;
  const realFetch = global.fetch;

  beforeEach(() => {
    verifier = new AiProviderVerifier();
  });
  afterEach(() => {
    global.fetch = realFetch;
  });

  function mockFetch(ok: boolean) {
    const fn = jest.fn().mockResolvedValue({ ok } as Response);
    global.fetch = fn as unknown as typeof fetch;
    return fn;
  }

  it('OpenAI : GET /models avec Bearer, TESTED si 200', async () => {
    const fn = mockFetch(true);
    await expect(verifier.verify('openai', 'sk-key')).resolves.toBe(true);
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/models');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer sk-key');
  });

  it('Anthropic : en-têtes x-api-key + anthropic-version', async () => {
    const fn = mockFetch(true);
    await verifier.verify('anthropic', 'sk-ant');
    const [url, init] = fn.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/models');
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('sk-ant');
    expect((init.headers as Record<string, string>)['anthropic-version']).toBeDefined();
  });

  it('Gemini : clé en query string', async () => {
    const fn = mockFetch(true);
    await verifier.verify('gemini', 'AIzaKEY');
    expect(fn.mock.calls[0][0]).toContain('key=AIzaKEY');
  });

  it('Ollama : sondé sans en-tête d’auth (pas de clé)', async () => {
    const fn = mockFetch(true);
    await verifier.verify('ollama', '');
    const init = fn.mock.calls[0][1];
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it('réponse non-OK → false', async () => {
    mockFetch(false);
    await expect(verifier.verify('openai', 'bad')).resolves.toBe(false);
  });

  it('erreur réseau → false (jamais d’exception)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;
    await expect(verifier.verify('openai', 'sk')).resolves.toBe(false);
  });
});

import { requireEnv } from '@event-foundry/libraries';

describe('requireEnv (secrets jamais codés en dur — ADR.21)', () => {
  const KEY = 'TEST_REQUIRE_ENV_KEY';
  const ALT = 'TEST_REQUIRE_ENV_ALT';

  afterEach(() => {
    delete process.env[KEY];
    delete process.env[ALT];
  });

  it('retourne la valeur quand la variable est renseignée', () => {
    process.env[KEY] = 'secret-value';
    expect(requireEnv(KEY)).toBe('secret-value');
  });

  it('utilise un nom de repli quand le premier est absent', () => {
    process.env[ALT] = 'fallback-value';
    expect(requireEnv(KEY, ALT)).toBe('fallback-value');
  });

  it('échoue de façon explicite quand aucune valeur n’est fournie (pas de défaut)', () => {
    expect(() => requireEnv(KEY, ALT)).toThrow(/Variable d'environnement requise absente/);
  });

  it('ignore une valeur vide / blanche', () => {
    process.env[KEY] = '   ';
    expect(() => requireEnv(KEY)).toThrow();
  });
});

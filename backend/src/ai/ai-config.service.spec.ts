import { SecretScope, SecretStatus, SecretType, type AiConfig } from '@prisma/client';
import type { SecretMetadata, SecretsProvider } from '../secrets/ports/secrets-provider';
import { AiConfigRepository } from './ai-config.repository';
import { AiConfigService, PLATFORM_SCOPE_KEY } from './ai-config.service';

describe('AiConfigService (ADR.16 / TSPEC.07)', () => {
  let repo: jest.Mocked<Pick<AiConfigRepository, 'find' | 'upsert' | 'setStatus'>>;
  let secrets: jest.Mocked<SecretsProvider>;
  let service: AiConfigService;

  const config = (over: Partial<AiConfig> = {}): AiConfig =>
    ({
      id: 'c-1',
      scope: SecretScope.USER,
      scopeKey: 'user-1',
      provider: 'openai',
      model: 'gpt-4o-mini',
      secretRef: 'ref-1',
      enabled: true,
      useCases: { OCR: true },
      status: SecretStatus.CONFIGURED,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...over,
    }) as AiConfig;

  const meta = (over: Partial<SecretMetadata> = {}): SecretMetadata => ({
    reference: 'ref-1',
    type: SecretType.AI_KEY,
    scope: SecretScope.USER,
    scopeId: 'user-1',
    provider: 'openai',
    lastFour: 'abcd',
    masked: '••••abcd',
    status: SecretStatus.CONFIGURED,
    createdAt: '',
    rotatedAt: null,
    expiresAt: null,
    ...over,
  });

  beforeEach(() => {
    repo = { find: jest.fn(), upsert: jest.fn(), setStatus: jest.fn() };
    secrets = {
      put: jest.fn(),
      resolve: jest.fn(),
      rotate: jest.fn(),
      describe: jest.fn(),
      setStatus: jest.fn(),
      revoke: jest.fn(),
    };
    service = new AiConfigService(repo as unknown as AiConfigRepository, secrets);
  });

  it('update : stocke la clé comme secret et ne la renvoie jamais', async () => {
    repo.find.mockResolvedValue(null);
    secrets.put.mockResolvedValue(meta());
    secrets.describe.mockResolvedValue(meta());
    repo.upsert.mockResolvedValue(config());

    const dto = await service.update(SecretScope.USER, 'user-1', {
      provider: 'openai',
      model: 'gpt-4o-mini',
      enabled: true,
      useCases: { OCR: true },
      apiKey: 'sk-live-secret-abcd',
    });

    expect(secrets.put).toHaveBeenCalledWith(
      expect.objectContaining({ type: SecretType.AI_KEY, provider: 'openai', value: 'sk-live-secret-abcd' }),
    );
    // La réponse ne contient que des métadonnées masquées.
    expect(dto.secret?.masked).toBe('••••abcd');
    expect(JSON.stringify(dto)).not.toContain('sk-live-secret-abcd');
  });

  it('update sans apiKey : conserve la référence de secret existante (pas de rotation)', async () => {
    repo.find.mockResolvedValue(config({ secretRef: 'ref-existing' }));
    secrets.describe.mockResolvedValue(meta({ reference: 'ref-existing' }));
    repo.upsert.mockResolvedValue(config({ secretRef: 'ref-existing' }));

    await service.update(SecretScope.USER, 'user-1', {
      provider: 'openai',
      model: 'gpt-4o-mini',
      enabled: false,
      useCases: {},
    });

    expect(secrets.put).not.toHaveBeenCalled();
    expect(repo.upsert.mock.calls[0][2].secretRef).toBe('ref-existing');
  });

  it('test : TESTED si la clé se résout, sinon FAILED', async () => {
    repo.find.mockResolvedValue(config());
    repo.setStatus.mockResolvedValue(config());
    secrets.resolve.mockResolvedValue('sk-live-secret-abcd');
    await expect(service.test(SecretScope.USER, 'user-1')).resolves.toEqual({ status: SecretStatus.TESTED });

    secrets.resolve.mockResolvedValue('');
    await expect(service.test(SecretScope.USER, 'user-1')).resolves.toEqual({ status: SecretStatus.FAILED });
  });

  it('resolveForUseCase : priorité utilisateur puis repli plateforme ; ignore si cas non activé', async () => {
    repo.find.mockImplementation((scope, scopeKey) => {
      if (scope === SecretScope.USER && scopeKey === 'user-1') {
        return Promise.resolve(config({ enabled: true, useCases: { OCR: false } })); // OCR non activé
      }
      if (scope === SecretScope.PLATFORM && scopeKey === PLATFORM_SCOPE_KEY) {
        return Promise.resolve(config({ scope: SecretScope.PLATFORM, provider: 'ollama', useCases: { OCR: true } }));
      }
      return Promise.resolve(null);
    });
    secrets.resolve.mockResolvedValue('platform-key');

    const resolved = await service.resolveForUseCase('user-1', null, 'OCR');
    expect(resolved).toEqual(
      expect.objectContaining({ scope: SecretScope.PLATFORM, provider: 'ollama', apiKey: 'platform-key' }),
    );
  });

  it('resolveForUseCase : aucun assistant → null (repli déterministe)', async () => {
    repo.find.mockResolvedValue(null);
    await expect(service.resolveForUseCase('user-1', null, 'OCR')).resolves.toBeNull();
  });
});

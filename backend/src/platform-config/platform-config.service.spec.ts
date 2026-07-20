import { SecretScope, SecretStatus, SecretType, type PlatformSetting } from '@prisma/client';
import type { SecretMetadata, SecretsProvider } from '../secrets/ports/secrets-provider';
import { PlatformConfigRepository } from './platform-config.repository';
import { PlatformConfigService } from './platform-config.service';

describe('PlatformConfigService — configuration mail (FSPEC.09)', () => {
  let repo: jest.Mocked<Pick<PlatformConfigRepository, 'find' | 'upsert' | 'setStatus'>>;
  let secrets: jest.Mocked<SecretsProvider>;
  let service: PlatformConfigService;

  const setting = (over: Partial<PlatformSetting> = {}): PlatformSetting =>
    ({
      id: 's-1',
      section: 'MAIL',
      key: 'smtp',
      value: { host: 'smtp.example.com', port: 587, secure: true, from: 'no-reply@ef.app', username: 'ef' },
      secretRef: 'ref-smtp',
      status: SecretStatus.CONFIGURED,
      updatedAt: new Date(),
      ...over,
    }) as PlatformSetting;

  const meta = (): SecretMetadata => ({
    reference: 'ref-smtp',
    type: SecretType.SMTP,
    scope: SecretScope.PLATFORM,
    scopeId: null,
    provider: 'smtp.example.com',
    lastFour: 'word',
    masked: '••••word',
    status: SecretStatus.CONFIGURED,
    createdAt: '',
    rotatedAt: null,
    expiresAt: null,
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
    service = new PlatformConfigService(repo as unknown as PlatformConfigRepository, secrets);
  });

  it('updateMail : stocke le mot de passe comme secret, ne le renvoie jamais', async () => {
    repo.find.mockResolvedValueOnce(null).mockResolvedValue(setting());
    secrets.put.mockResolvedValue(meta());
    secrets.describe.mockResolvedValue(meta());
    repo.upsert.mockResolvedValue(setting());

    const dto = await service.updateMail({
      host: 'smtp.example.com',
      port: 587,
      secure: true,
      from: 'no-reply@ef.app',
      username: 'ef',
      password: 'super-secret-word',
    });

    expect(secrets.put).toHaveBeenCalledWith(
      expect.objectContaining({ type: SecretType.SMTP, scope: SecretScope.PLATFORM, value: 'super-secret-word' }),
    );
    expect(dto.passwordMasked).toBe('••••word');
    expect(JSON.stringify(dto)).not.toContain('super-secret-word');
  });

  it('testMail : TESTED quand hôte + identifiants résolus, sinon FAILED', async () => {
    repo.find.mockResolvedValue(setting());
    repo.setStatus.mockResolvedValue(setting());
    secrets.resolve.mockResolvedValue('super-secret-word');
    await expect(service.testMail()).resolves.toEqual({ status: SecretStatus.TESTED });

    secrets.resolve.mockRejectedValue(new Error('missing'));
    await expect(service.testMail()).resolves.toEqual({ status: SecretStatus.FAILED });
  });
});

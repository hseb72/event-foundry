import { SecretScope, SecretStatus, SecretType, type PlatformSetting } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import type { SecretMetadata, SecretsProvider } from '../secrets/ports/secrets-provider';
import { PlatformConfigRepository } from './platform-config.repository';
import { PlatformConfigService } from './platform-config.service';

jest.mock('nodemailer');
const nodemailerMock = nodemailer as jest.Mocked<typeof nodemailer>;
const verify = jest.fn();

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

  it('getGeneral : repli sur les valeurs par défaut quand rien n’est configuré', async () => {
    repo.find.mockResolvedValue(null);
    await expect(service.getGeneral()).resolves.toMatchObject({ platformName: 'EventFoundry' });
  });

  it('updateGeneral : persiste l’identité publique (sans secret)', async () => {
    repo.upsert.mockResolvedValue(setting());
    const result = await service.updateGeneral({
      platformName: 'MyPlatform',
      contactEmail: 'c@x.io',
      supportEmail: 's@x.io',
    });
    expect(result).toMatchObject({ platformName: 'MyPlatform', recruitmentEmail: null });
    expect(repo.upsert).toHaveBeenCalledWith('GENERAL', 'info', expect.objectContaining({ secretRef: null }));
  });

  it('testMail : TESTED quand la connexion SMTP se vérifie, FAILED sinon', async () => {
    repo.find.mockResolvedValue(setting());
    repo.setStatus.mockResolvedValue(setting());
    secrets.resolve.mockResolvedValue('super-secret-word');
    nodemailerMock.createTransport.mockReturnValue({ verify } as never);

    verify.mockResolvedValueOnce(true);
    await expect(service.testMail()).resolves.toEqual({ status: SecretStatus.TESTED });

    // Connexion refusée (mauvais port/secure/credentials) → FAILED, sans propager.
    verify.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(service.testMail()).resolves.toEqual({ status: SecretStatus.FAILED });
  });
});

import { DEFAULT_MAX_UPLOAD_BYTES } from '../imports/imports.constants';
import { PlatformConfigRepository } from './platform-config.repository';
import { TechnicalConfigService } from './technical-config.service';

describe('TechnicalConfigService (limites techniques — OPE-005)', () => {
  let repository: jest.Mocked<Pick<PlatformConfigRepository, 'find' | 'upsert'>>;
  let service: TechnicalConfigService;

  beforeEach(() => {
    repository = { find: jest.fn(), upsert: jest.fn().mockResolvedValue(undefined) };
    service = new TechnicalConfigService(repository as unknown as PlatformConfigRepository);
  });

  it('renvoie les valeurs par défaut quand rien n’est configuré', async () => {
    repository.find.mockResolvedValue(null);
    const view = await service.get();
    expect(view).toEqual({
      maxUploadBytes: DEFAULT_MAX_UPLOAD_BYTES,
      maxImportsPerDay: 0,
      hardMaxUploadBytes: DEFAULT_MAX_UPLOAD_BYTES,
      autoProvisionReferentials: false,
      provisioningDefaultDomainId: null,
    });
  });

  it('expose le réglage d’auto-provisioning (opt-out par défaut, valeurs stockées sinon)', async () => {
    repository.find.mockResolvedValue({
      value: { autoProvisionReferentials: true, provisioningDefaultDomainId: 'dom-1' },
    } as never);
    const prov = await service.getProvisioning();
    expect(prov).toEqual({ autoProvisionReferentials: true, provisioningDefaultDomainId: 'dom-1' });
  });

  it('borne maxUploadBytes au plafond dur et interdit les valeurs négatives', async () => {
    repository.find.mockResolvedValue(null);
    await service.update({ maxUploadBytes: DEFAULT_MAX_UPLOAD_BYTES * 10, maxImportsPerDay: -3 });
    const stored = repository.upsert.mock.calls[0][2].value as { maxUploadBytes: number; maxImportsPerDay: number };
    expect(stored.maxUploadBytes).toBe(DEFAULT_MAX_UPLOAD_BYTES);
    expect(stored.maxImportsPerDay).toBe(0);
  });

  it('relit les limites stockées', async () => {
    repository.find.mockResolvedValue({ value: { maxUploadBytes: 2048, maxImportsPerDay: 50 } } as never);
    const limits = await service.getLimits();
    expect(limits).toEqual({ maxUploadBytes: 2048, maxImportsPerDay: 50 });
  });
});

import { MunicipalityNotFoundException } from '../common/exceptions';
import { RegionRepository } from '../regions/region.repository';
import { MunicipalitiesService } from './municipalities.service';
import type { MunicipalityWithGeo } from './municipality.mapper';
import { MunicipalityRepository } from './municipality.repository';

describe('MunicipalitiesService — localisation V3 (pays + code postal)', () => {
  let repository: jest.Mocked<
    Pick<MunicipalityRepository, 'resolveByPostalCode' | 'findWithGeo'>
  >;
  let service: MunicipalitiesService;

  beforeEach(() => {
    repository = {
      resolveByPostalCode: jest.fn(),
      findWithGeo: jest.fn(),
    };
    service = new MunicipalitiesService(
      repository as unknown as MunicipalityRepository,
      {} as unknown as RegionRepository,
    );
  });

  it('résout par pays + code postal en normalisant le code (trim)', async () => {
    repository.resolveByPostalCode.mockResolvedValue([]);
    await service.resolveByPostalCode('country-1', '  75000 ');
    expect(repository.resolveByPostalCode).toHaveBeenCalledWith('country-1', '75000');
  });

  it('peut renvoyer plusieurs communes pour un même code postal (désambiguïsation)', async () => {
    const communes = [
      { id: 'm-1', name: 'Ville A' },
      { id: 'm-2', name: 'Ville B' },
    ] as unknown as MunicipalityWithGeo[];
    repository.resolveByPostalCode.mockResolvedValue(communes);

    const result = await service.resolveByPostalCode('country-1', '75000');

    expect(result).toHaveLength(2);
  });

  it('expose la vue géographique (région dérivée) d’une commune existante', async () => {
    const commune = { id: 'm-1', name: 'Paris' } as unknown as MunicipalityWithGeo;
    repository.findWithGeo.mockResolvedValue(commune);

    await expect(service.getGeoOrThrow('m-1')).resolves.toBe(commune);
  });

  it('rejette la vue géographique quand la commune est introuvable', async () => {
    repository.findWithGeo.mockResolvedValue(null);
    await expect(service.getGeoOrThrow('missing')).rejects.toBeInstanceOf(
      MunicipalityNotFoundException,
    );
  });
});

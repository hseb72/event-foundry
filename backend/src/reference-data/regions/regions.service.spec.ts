import type { Country, Region } from '@prisma/client';
import { CountryNotFoundException } from '../common/exceptions';
import { CountryRepository } from '../countries/country.repository';
import { RegionRepository } from './region.repository';
import { RegionsService } from './regions.service';

describe('RegionsService', () => {
  let repository: jest.Mocked<Pick<RegionRepository, 'create' | 'list' | 'listByCountry' | 'findById'>>;
  let countryRepository: jest.Mocked<Pick<CountryRepository, 'findById'>>;
  let service: RegionsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      list: jest.fn(),
      listByCountry: jest.fn(),
      findById: jest.fn(),
    };
    countryRepository = { findById: jest.fn() };
    service = new RegionsService(
      repository as unknown as RegionRepository,
      countryRepository as unknown as CountryRepository,
    );
  });

  it('rejette la création quand le Country parent est introuvable', async () => {
    countryRepository.findById.mockResolvedValue(null);
    await expect(
      service.create({ name: 'Île-de-France', countryId: 'missing' }),
    ).rejects.toBeInstanceOf(CountryNotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('crée une Region quand le Country parent existe', async () => {
    countryRepository.findById.mockResolvedValue({ id: 'country-1' } as Country);
    repository.create.mockResolvedValue({ id: 'region-1', name: 'Île-de-France' } as Region);

    const created = await service.create({ name: 'Île-de-France', countryId: 'country-1' });

    expect(created.id).toBe('region-1');
    expect(repository.create).toHaveBeenCalledWith({ name: 'Île-de-France', countryId: 'country-1' });
  });

  it('liste par pays lorsque countryId est fourni', async () => {
    repository.listByCountry.mockResolvedValue([]);
    await service.list(false, 'country-1');
    expect(repository.listByCountry).toHaveBeenCalledWith('country-1', false);
    expect(repository.list).not.toHaveBeenCalled();
  });
});

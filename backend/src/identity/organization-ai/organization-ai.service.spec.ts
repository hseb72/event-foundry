import { ForbiddenException } from '@nestjs/common';
import { SecretScope } from '@prisma/client';
import { AiConfigService } from '../../ai/ai-config.service';
import { IdentityRepository } from '../repositories/identity.repository';
import { OrganizationAiService } from './organization-ai.service';

describe('OrganizationAiService — config IA d’organisation (isolation membre)', () => {
  let ai: jest.Mocked<Pick<AiConfigService, 'get' | 'update' | 'test'>>;
  let identity: jest.Mocked<Pick<IdentityRepository, 'isMember'>>;
  let service: OrganizationAiService;

  beforeEach(() => {
    ai = { get: jest.fn(), update: jest.fn(), test: jest.fn() };
    identity = { isMember: jest.fn() };
    service = new OrganizationAiService(
      ai as unknown as AiConfigService,
      identity as unknown as IdentityRepository,
    );
  });

  it('refuse l’accès à un non-membre', async () => {
    identity.isMember.mockResolvedValue(false);
    await expect(service.get('user-1', 'org-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(ai.get).not.toHaveBeenCalled();
  });

  it('délègue au service IA en portée ORGANIZATION pour un membre', async () => {
    identity.isMember.mockResolvedValue(true);
    ai.update.mockResolvedValue({} as never);
    await service.update('user-1', 'org-1', {
      provider: 'openai',
      model: 'gpt-4o-mini',
      enabled: true,
      useCases: { OCR: true },
    });
    expect(ai.update).toHaveBeenCalledWith(SecretScope.ORGANIZATION, 'org-1', expect.any(Object));
  });
});

import { ForbiddenException, Injectable } from '@nestjs/common';
import { SecretScope, SecretStatus } from '@prisma/client';
import { AiConfigService } from '../../ai/ai-config.service';
import { AiConfigDto, UpdateAiConfigDto } from '../../ai/dto/ai-config.dto';
import { IdentityRepository } from '../repositories/identity.repository';

/**
 * Configuration IA d'une organisation (ADR.16 / TSPEC.07), à la main de l'organizer
 * (`organization.manage`). Isolation multi-tenant : l'utilisateur doit être membre (RG-ORG-05).
 * Délègue au service IA en portée ORGANIZATION ; la clé reste un secret (jamais renvoyée).
 */
@Injectable()
export class OrganizationAiService {
  constructor(
    private readonly ai: AiConfigService,
    private readonly identity: IdentityRepository,
  ) {}

  async get(userId: string, organizationId: string): Promise<AiConfigDto | null> {
    await this.assertMember(userId, organizationId);
    return this.ai.get(SecretScope.ORGANIZATION, organizationId);
  }

  async update(userId: string, organizationId: string, dto: UpdateAiConfigDto): Promise<AiConfigDto> {
    await this.assertMember(userId, organizationId);
    return this.ai.update(SecretScope.ORGANIZATION, organizationId, dto);
  }

  async test(userId: string, organizationId: string): Promise<{ status: SecretStatus }> {
    await this.assertMember(userId, organizationId);
    return this.ai.test(SecretScope.ORGANIZATION, organizationId);
  }

  private async assertMember(userId: string, organizationId: string): Promise<void> {
    if (!(await this.identity.isMember(userId, organizationId))) {
      throw new ForbiddenException("Vous n'êtes pas membre de cette organisation.");
    }
  }
}

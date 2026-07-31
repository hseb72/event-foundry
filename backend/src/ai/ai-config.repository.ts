import { Injectable } from '@nestjs/common';
import type { AiConfig, Prisma, SecretScope, SecretStatus } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';

/** Accès PostgreSQL aux configurations IA (Prisma confiné au Repository — ADR.02). */
@Injectable()
export class AiConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(scope: SecretScope, scopeKey: string): Promise<AiConfig | null> {
    return this.prisma.aiConfig.findUnique({ where: { scope_scopeKey: { scope, scopeKey } } });
  }

  upsert(
    scope: SecretScope,
    scopeKey: string,
    data: {
      provider: string;
      model: string;
      enabled: boolean;
      useCases: Prisma.InputJsonValue;
      secretRef: string | null;
      status: SecretStatus;
    },
  ): Promise<AiConfig> {
    return this.prisma.aiConfig.upsert({
      where: { scope_scopeKey: { scope, scopeKey } },
      update: { ...data },
      create: { scope, scopeKey, ...data },
    });
  }

  setStatus(scope: SecretScope, scopeKey: string, status: SecretStatus): Promise<AiConfig> {
    return this.prisma.aiConfig.update({
      where: { scope_scopeKey: { scope, scopeKey } },
      data: { status },
    });
  }
}

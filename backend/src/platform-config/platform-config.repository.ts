import { Injectable } from '@nestjs/common';
import type { PlatformSetting, Prisma, SecretStatus } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';

/** Accès PostgreSQL aux paramètres plateforme (Prisma confiné au Repository — ADR.02). */
@Injectable()
export class PlatformConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(section: string, key: string): Promise<PlatformSetting | null> {
    return this.prisma.platformSetting.findUnique({ where: { section_key: { section, key } } });
  }

  upsert(
    section: string,
    key: string,
    data: { value: Prisma.InputJsonValue; secretRef: string | null; status: SecretStatus },
  ): Promise<PlatformSetting> {
    return this.prisma.platformSetting.upsert({
      where: { section_key: { section, key } },
      update: { ...data },
      create: { section, key, ...data },
    });
  }

  setStatus(section: string, key: string, status: SecretStatus): Promise<PlatformSetting> {
    return this.prisma.platformSetting.update({
      where: { section_key: { section, key } },
      data: { status },
    });
  }
}

import { Injectable } from '@nestjs/common';
import type { Prisma, SecretRef, SecretStatus } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

/** Métadonnées des secrets (jamais la valeur). Prisma confiné au Repository (ADR.02). */
@Injectable()
export class SecretRefRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByReference(reference: string): Promise<SecretRef | null> {
    return this.prisma.secretRef.findUnique({ where: { reference } });
  }

  upsert(reference: string, data: Prisma.SecretRefCreateInput): Promise<SecretRef> {
    const { reference: _ref, ...rest } = data;
    return this.prisma.secretRef.upsert({
      where: { reference },
      update: {
        type: rest.type,
        scope: rest.scope,
        scopeId: rest.scopeId ?? null,
        provider: rest.provider ?? null,
        lastFour: rest.lastFour ?? null,
        status: rest.status,
        rotatedAt: rest.rotatedAt ?? null,
      },
      create: data,
    });
  }

  setStatus(reference: string, status: SecretStatus): Promise<SecretRef> {
    return this.prisma.secretRef.update({ where: { reference }, data: { status } });
  }

  markRotated(reference: string, lastFour: string): Promise<SecretRef> {
    return this.prisma.secretRef.update({
      where: { reference },
      data: { lastFour, rotatedAt: new Date() },
    });
  }
}

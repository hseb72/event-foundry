import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Unique propriétaire de Prisma Client dans le Backend.
 *
 * Aucun Controller, Service ou Worker n'importe Prisma Client directement : seuls les
 * Repositories (via ce service) accèdent à PostgreSQL (ADR.02, ADR.07, TSPEC.02).
 *
 * Prisma 7 : la connexion passe par un driver adapter (@prisma/adapter-pg) construit à
 * partir de `DATABASE_URL`, plutôt que par l'URL déclarée dans le schéma.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

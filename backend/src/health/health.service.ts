import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../infra/prisma/prisma.service';

export interface DependencyHealth {
  status: 'up' | 'down';
  error?: string;
}

export interface ReadinessReport {
  status: 'ok' | 'degraded';
  dependencies: Record<string, DependencyHealth>;
}

/**
 * Sondes de santé du Backend (TSPEC.07). Liveness = le process répond ; readiness = les
 * dépendances critiques (PostgreSQL, Redis) sont joignables.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async readiness(): Promise<ReadinessReport> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const dependencies = { database, redis };
    const allUp = Object.values(dependencies).every((dep) => dep.status === 'up');
    return { status: allUp ? 'ok' : 'degraded', dependencies };
  }

  private async checkDatabase(): Promise<DependencyHealth> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: messageOf(error) };
    }
  }

  private async checkRedis(): Promise<DependencyHealth> {
    // Client éphémère et borné : on ne retente pas, on échoue vite si Redis est indisponible.
    const client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.config.get<string>('REDIS_PORT', '6379')),
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
    try {
      await client.connect();
      const pong = await client.ping();
      return pong === 'PONG' ? { status: 'up' } : { status: 'down', error: `réponse: ${pong}` };
    } catch (error) {
      return { status: 'down', error: messageOf(error) };
    } finally {
      client.disconnect();
    }
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { MinioService } from '../src/infra/minio/minio.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';

/** Stub MinIO : aucun accès objet réel pendant les tests E2E. */
const minioStub = {
  bucketName: 'test-bucket',
  putObject: async (): Promise<void> => undefined,
  getObject: async (): Promise<never> => {
    throw new Error('MinIO indisponible en E2E.');
  },
};

/** Démarre l'application Nest complète (prefix + ValidationPipe comme en production). */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MinioService)
    .useValue(minioStub)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();
  return app;
}

export function prisma(app: INestApplication): PrismaService {
  return app.get(PrismaService);
}

/** Garantit la présence des rôles système (idempotent, tolérant aux exécutions concurrentes). */
export async function ensureRoles(app: INestApplication): Promise<void> {
  const db = prisma(app);
  for (const name of ['ADMIN', 'USER']) {
    const existing = await db.role.findUnique({ where: { name } });
    if (existing) {
      continue;
    }
    // Deux suites peuvent créer le rôle en parallèle : on ignore la violation d'unicité.
    await db.role.create({ data: { name } }).catch((error: { code?: string }) => {
      if (error.code !== 'P2002') {
        throw error;
      }
    });
  }
}

/** Crée un utilisateur avec les rôles donnés (mot de passe haché), et le retourne. */
export async function createUser(
  app: INestApplication,
  email: string,
  password: string,
  roleNames: string[],
): Promise<{ id: string }> {
  const db = prisma(app);
  const passwordHash = await bcrypt.hash(password, 4);
  const roles = await db.role.findMany({ where: { name: { in: roleNames } } });
  return db.user.create({
    data: {
      email,
      passwordHash,
      displayName: email,
      roles: { create: roles.map((role) => ({ roleId: role.id })) },
    },
    select: { id: true },
  });
}

/** Adresse e-mail unique par test pour éviter les collisions sur une base partagée. */
export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.local`;
}

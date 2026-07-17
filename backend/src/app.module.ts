import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ImportsModule } from './imports/imports.module';
import { MinioModule } from './infra/minio/minio.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { QueueModule } from './infra/queue/queue.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';
import { UsersModule } from './users/users.module';

/**
 * Module racine du Backend.
 *
 * Capacités déjà câblées : authentification (`auth`), utilisateurs (`users`),
 * référentiels (`reference-data`) et acquisition (`imports`).
 * À venir (TSPEC.01) : event-candidates, events, search, participation, calendar.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MinioModule,
    QueueModule,
    UsersModule,
    AuthModule,
    ReferenceDataModule,
    ImportsModule,
  ],
})
export class AppModule {}

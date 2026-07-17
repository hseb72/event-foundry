import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';
import { UsersModule } from './users/users.module';

/**
 * Module racine du Backend.
 *
 * Capacités déjà câblées : authentification (`auth`), utilisateurs (`users`) et
 * référentiels (`reference-data`).
 * À venir (TSPEC.01) : imports, event-candidates, events, search, participation, calendar.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ReferenceDataModule,
  ],
})
export class AppModule {}

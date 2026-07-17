import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { UsersModule } from './users/users.module';

/**
 * Module racine du Backend.
 *
 * Capacités déjà câblées : authentification (`auth`) et utilisateurs (`users`).
 * À venir (TSPEC.01) : reference-data, imports, event-candidates, events, search,
 * participation, calendar.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, UsersModule, AuthModule],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Module racine du Backend.
 *
 * Chaque capacité métier sera ajoutée comme module indépendant (TSPEC.01) :
 *   auth, users, reference-data, imports, event-candidates, events,
 *   search, participation, calendar.
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
})
export class AppModule {}

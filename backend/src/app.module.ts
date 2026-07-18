import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { EventCandidatesModule } from './event-candidates/event-candidates.module';
import { EventsModule } from './events/events.module';
import { ImportsModule } from './imports/imports.module';
import { MinioModule } from './infra/minio/minio.module';
import { ParticipationModule } from './participation/participation.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { QueueModule } from './infra/queue/queue.module';
import { ReferenceDataModule } from './reference-data/reference-data.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';

/**
 * Module racine du Backend.
 *
 * Capacités déjà câblées : authentification (`auth`), utilisateurs (`users`),
 * référentiels (`reference-data`), acquisition (`imports`), validation
 * (`event-candidates`), events (`events`), participation et calendrier.
 * Le parcours V1 complet est câblé.
 */
@Module({
  imports: [
    // Charge le .env racine (cwd = backend/ en dev) ; en prod, secrets injectés par K8s.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../.env', '.env'] }),
    PrismaModule,
    MinioModule,
    QueueModule,
    UsersModule,
    AuthModule,
    ReferenceDataModule,
    ImportsModule,
    EventsModule,
    EventCandidatesModule,
    ParticipationModule,
    CalendarModule,
    StatsModule,
  ],
})
export class AppModule {}

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CorrelationMiddleware } from './common/correlation/correlation.middleware';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
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
    HealthModule,
    MetricsModule,
  ],
})
export class AppModule implements NestModule {
  // Contexte de corrélation établi pour toute requête HTTP (propagé aux logs et aux Jobs).
  configure(consumer: MiddlewareConsumer): void {
    // Express 5 / path-to-regexp v8 : le joker nommé « {*path} » remplace l'ancien « * ».
    consumer.apply(CorrelationMiddleware).forRoutes('{*path}');
  }
}

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { CorrelationMiddleware } from './common/correlation/correlation.middleware';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { CalendarModule } from './calendar/calendar.module';
import { EventCandidatesModule } from './event-candidates/event-candidates.module';
import { CasesModule } from './cases/cases.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PublicModule } from './public/public.module';
import { EventsModule } from './events/events.module';
import { IdentityModule } from './identity/identity.module';
import { ImportsModule } from './imports/imports.module';
import { MinioModule } from './infra/minio/minio.module';
import { ParticipationModule } from './participation/participation.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FollowModule } from './follow/follow.module';
import { PlanningModule } from './planning/planning.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { SearchModule } from './search/search.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { EventBusModule } from './platform/event-bus/event-bus.module';
import { SecretsModule } from './secrets/secrets.module';
import { AiModule } from './ai/ai.module';
import { PlatformConfigModule } from './platform-config/platform-config.module';
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
    EventBusModule,
    SecretsModule,
    AiModule,
    PlatformConfigModule,
    MinioModule,
    QueueModule,
    UsersModule,
    IdentityModule,
    AuthModule,
    AccountModule,
    OrganizationsModule,
    CasesModule,
    ReferenceDataModule,
    ImportsModule,
    EventsModule,
    EventCandidatesModule,
    ParticipationModule,
    CalendarModule,
    PlanningModule,
    DiscoveryModule,
    PublicModule,
    SearchModule,
    RecommendationModule,
    NotificationsModule,
    FollowModule,
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

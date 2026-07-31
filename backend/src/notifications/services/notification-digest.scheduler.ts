import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import type { DigestTrack } from '../repositories/notification.repository';
import { NotificationDigestService } from './notification-digest.service';

const QUEUE_NAME = 'notification-digest';

/** Planification par défaut (UTC) des passages de récap — surchargables par configuration. */
const DEFAULT_SCHEDULES: Record<DigestTrack, string> = {
  daily: '0 6 * * *', // tous les jours à 06:00 UTC
  weekly: '0 7 * * 1', // chaque lundi à 07:00 UTC
};

/**
 * Déclencheur **intégré** du planificateur de récaps (décision FSPEC.04 : job récurrent BullMQ). Pose
 * deux jobs répétables (quotidien / hebdomadaire) et un Worker in-process qui délègue l'agrégation à
 * `NotificationDigestService`. Découplé du calcul : le même `runDigest` reste invocable à la main
 * (alternative « commande run-digest »). Désactivable par `NOTIFICATIONS_DIGEST_ENABLED=false` (tests,
 * exploitation par cron externe). L'initialisation est défensive : une indisponibilité Redis est
 * journalisée mais ne bloque jamais le démarrage du Backend.
 */
@Injectable()
export class NotificationDigestScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationDigestScheduler.name);
  private queue?: Queue;
  private worker?: Worker;

  constructor(
    private readonly config: ConfigService,
    private readonly digest: NotificationDigestService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get<string>('NOTIFICATIONS_DIGEST_ENABLED', 'true') === 'false') {
      this.logger.log('Planificateur de récaps désactivé (NOTIFICATIONS_DIGEST_ENABLED=false).');
      return;
    }
    const connection = {
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.config.get<string>('REDIS_PORT', '6379')),
    };
    try {
      this.queue = new Queue(QUEUE_NAME, { connection });
      this.worker = new Worker<{ track: DigestTrack }>(
        QUEUE_NAME,
        (job) => this.digest.runDigest(job.data.track).then(() => undefined),
        { connection },
      );
      this.worker.on('failed', (job, error) =>
        this.logger.error(`Récap ${job?.data?.track} en échec : ${error.message}`),
      );
      for (const track of ['daily', 'weekly'] as const) {
        await this.queue.add(
          track,
          { track },
          {
            repeat: { pattern: this.config.get<string>(`NOTIFICATIONS_DIGEST_${track.toUpperCase()}_CRON`, DEFAULT_SCHEDULES[track]) },
            jobId: `digest-${track}`,
            removeOnComplete: 100,
            removeOnFail: 100,
          },
        );
      }
      this.logger.log('Planificateur de récaps armé (quotidien + hebdomadaire).');
    } catch (error) {
      this.logger.error("Planificateur de récaps non armé (Redis indisponible ?)", error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }
}

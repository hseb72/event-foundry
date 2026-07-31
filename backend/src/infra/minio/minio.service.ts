import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

/**
 * Accès au stockage objet MinIO (ARCHI.01 : tous les fichiers vivent dans MinIO,
 * jamais en base). Encapsule le client afin que les Services dépendent d'une abstraction.
 */
@Injectable()
export class MinioService implements OnModuleInit {
  private readonly client: Minio.Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('MINIO_BUCKET');
    this.client = new Minio.Client({
      endPoint: config.getOrThrow<string>('MINIO_ENDPOINT'),
      port: Number(config.get<string>('MINIO_PORT', '9000')),
      useSSL: config.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: config.getOrThrow<string>('MINIO_ROOT_USER'),
      secretKey: config.getOrThrow<string>('MINIO_ROOT_PASSWORD'),
    });
  }

  async onModuleInit(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
  }

  get bucketName(): string {
    return this.bucket;
  }

  async putObject(key: string, buffer: Buffer, contentType: string): Promise<void> {
    try {
      await this.client.putObject(this.bucket, key, buffer, buffer.length, {
        'Content-Type': contentType,
      });
    } catch (error) {
      // Stockage plein : message clair (503) plutôt qu'un 500 opaque, pour tous les canaux d'import.
      if ((error as { code?: string }).code === 'XMinioStorageFull') {
        throw new ServiceUnavailableException(
          'Stockage de fichiers saturé : impossible d’enregistrer le document. ' +
            'Libérez de l’espace (purge des objets MinIO) puis réessayez.',
        );
      }
      throw error;
    }
  }

  getObject(key: string): Promise<NodeJS.ReadableStream> {
    return this.client.getObject(this.bucket, key);
  }

  async removeObject(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  /**
   * Duplique un objet **côté serveur** (aucun transfert par l'application). Permet de reprendre un
   * document déjà stocké sous une nouvelle clé sans jamais toucher à l'original — le document source
   * d'un import reste conservé tel quel (règle de traçabilité).
   */
  async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
    await this.client.copyObject(this.bucket, destinationKey, `/${this.bucket}/${sourceKey}`);
  }

  /** URL temporaire de lecture directe (pour affichage `<img>` sans en-tête d'auth). */
  presignedGetUrl(key: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expirySeconds);
  }
}

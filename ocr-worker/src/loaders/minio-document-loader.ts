import { Injectable } from '@nestjs/common';
import * as Minio from 'minio';
import type { Readable } from 'node:stream';
import { requireEnv } from '../config';
import type { DocumentLoader, LoadedDocument } from '../interfaces/document-loader.interface';

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

/**
 * Charge le document depuis MinIO. La clé est déterministe (`attachments/{attachmentId}`),
 * ce qui évite tout accès à PostgreSQL depuis le worker (TSPEC.04, ADR.07).
 */
@Injectable()
export class MinioDocumentLoader implements DocumentLoader {
  private readonly client: Minio.Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = requireEnv('MINIO_BUCKET');
    this.client = new Minio.Client({
      endPoint: requireEnv('MINIO_ENDPOINT'),
      port: Number(process.env.MINIO_PORT ?? '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: requireEnv('MINIO_ROOT_USER'),
      secretKey: requireEnv('MINIO_ROOT_PASSWORD'),
    });
  }

  async load(attachmentId: string): Promise<LoadedDocument> {
    const key = `attachments/${attachmentId}`;
    const stat = await this.client.statObject(this.bucket, key);
    const stream = await this.client.getObject(this.bucket, key);
    const buffer = await streamToBuffer(stream);
    const contentType = stat.metaData['content-type'] ?? 'application/octet-stream';
    return { buffer, contentType };
  }
}

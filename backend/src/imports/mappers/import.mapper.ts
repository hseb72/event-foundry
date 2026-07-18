import type { ImportJobDetail, ImportJobWithAttachment } from '../entities/import-job.entity';
import { ImportDetailResponseDto, ImportResponseDto } from '../dto/import-response.dto';

export class ImportMapper {
  static toResponse(job: ImportJobWithAttachment): ImportResponseDto {
    return {
      id: job.id,
      type: job.attachment.type,
      status: job.status,
      candidateCount: job._count.candidates,
      startedAt: job.startedAt ? job.startedAt.toISOString() : null,
      finishedAt: job.finishedAt ? job.finishedAt.toISOString() : null,
      createdAt: job.createdAt.toISOString(),
    };
  }

  static toDetail(job: ImportJobDetail): ImportDetailResponseDto {
    return {
      ...this.toResponse(job),
      attachment: {
        type: job.attachment.type,
        originalName: job.attachment.originalName,
        contentType: job.attachment.contentType,
        sizeBytes: job.attachment.sizeBytes,
      },
      ocrText: job.ocrText,
      ocr:
        job.ocrEngine === null && job.ocrConfidence === null
          ? null
          : {
              confidence: job.ocrConfidence,
              language: job.ocrLanguage,
              engine: job.ocrEngine,
              engineVersion: job.ocrEngineVersion,
              pageCount: job.ocrPageCount,
              processingTimeMs: job.ocrProcessingTimeMs,
            },
      timeline: job.events.map((event) => ({
        status: event.status,
        occurredAt: event.occurredAt.toISOString(),
        correlationId: event.correlationId,
      })),
    };
  }
}

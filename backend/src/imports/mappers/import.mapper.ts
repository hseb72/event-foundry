import type { ImportJobWithAttachment } from '../entities/import-job.entity';
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

  static toDetail(job: ImportJobWithAttachment): ImportDetailResponseDto {
    return {
      ...this.toResponse(job),
      attachment: {
        type: job.attachment.type,
        originalName: job.attachment.originalName,
        contentType: job.attachment.contentType,
        sizeBytes: job.attachment.sizeBytes,
      },
      ocrText: job.ocrText,
    };
  }
}

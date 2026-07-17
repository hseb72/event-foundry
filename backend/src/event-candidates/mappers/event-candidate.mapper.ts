import type { EventCandidate, EventCandidateWithImport } from '../entities/event-candidate.entity';
import {
  EventCandidateDetailResponseDto,
  EventCandidateResponseDto,
} from '../dto/event-candidate-response.dto';

export class EventCandidateMapper {
  static toResponse(candidate: EventCandidate): EventCandidateResponseDto {
    return {
      id: candidate.id,
      importJobId: candidate.importJobId,
      status: candidate.status,
      payload: candidate.payload as Record<string, unknown>,
      confidence: candidate.confidence as Record<string, number>,
      correctedAt: candidate.correctedAt ? candidate.correctedAt.toISOString() : null,
      createdAt: candidate.createdAt.toISOString(),
    };
  }

  static toDetail(candidate: EventCandidateWithImport): EventCandidateDetailResponseDto {
    return {
      ...this.toResponse(candidate),
      ocrText: candidate.importJob.ocrText,
    };
  }
}

import type {
  EventCandidate,
  EventCandidateWithCreator,
  EventCandidateWithImport,
} from '../entities/event-candidate.entity';
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

  /** Variante « vue d'organisation » : ajoute le pseudo de l'auteur de la soumission (FSPEC.22). */
  static toResponseWithCreator(candidate: EventCandidateWithCreator): EventCandidateResponseDto {
    return {
      ...this.toResponse(candidate),
      createdByName: candidate.importJob.createdBy?.displayName ?? null,
    };
  }

  static toDetail(candidate: EventCandidateWithImport): EventCandidateDetailResponseDto {
    return {
      ...this.toResponse(candidate),
      ocrText: candidate.importJob.ocrText,
    };
  }
}

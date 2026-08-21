import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { CreateEventInput, EventCandidateDetailDto, EventCandidateDto, EventDto } from '../models';

@Injectable({ providedIn: 'root' })
export class EventCandidatesApi {
  private readonly http = inject(HttpClient);

  /** Mes brouillons (FSPEC.22 §6) : candidats issus de mes propres soumissions. */
  listMine(status?: string): Observable<EventCandidateDto[]> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }
    return this.http.get<EventCandidateDto[]>(`${API_BASE}/me/event-candidates`, { params });
  }

  /**
   * Brouillons à qualifier de l'organisation active (FSPEC.22 — vue partagée d'équipe). Chaque
   * brouillon porte le pseudo de son auteur (`createdByName`).
   */
  listOrganization(status?: string): Observable<EventCandidateDto[]> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }
    return this.http.get<EventCandidateDto[]>(`${API_BASE}/organization/event-candidates`, {
      params,
    });
  }

  list(status?: string): Observable<EventCandidateDto[]> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }
    return this.http.get<EventCandidateDto[]>(`${API_BASE}/event-candidates`, { params });
  }

  detail(id: string): Observable<EventCandidateDetailDto> {
    return this.http.get<EventCandidateDetailDto>(`${API_BASE}/event-candidates/${id}`);
  }

  validate(id: string, body: CreateEventInput): Observable<EventDto> {
    return this.http.post<EventDto>(`${API_BASE}/event-candidates/${id}/validate`, body);
  }

  reject(id: string): Observable<EventCandidateDto> {
    return this.http.post<EventCandidateDto>(`${API_BASE}/event-candidates/${id}/reject`, {});
  }
}

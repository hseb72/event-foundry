import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';

export interface ModerationLogEntry {
  id: string;
  objectType: string;
  objectId: string;
  decision: string;
  justification: string | null;
  createdAt: string;
}

/** Client Modération (FSPEC.20) : signalement (tout utilisateur) + décisions (Operator). */
@Injectable({ providedIn: 'root' })
export class ModerationApi {
  private readonly http = inject(HttpClient);

  report(input: { objectType: string; objectId: string; reason: string; details?: string }): Observable<{ reference: string }> {
    return this.http.post<{ reference: string }>(`${API_BASE}/moderation/reports`, input);
  }

  catalog(): Observable<{ objects: string[]; reasons: string[]; decisions: string[] }> {
    return this.http.get<{ objects: string[]; reasons: string[]; decisions: string[] }>(
      `${API_BASE}/moderation/catalog`,
    );
  }

  decide(caseId: string, decision: string, justification?: string): Observable<ModerationLogEntry> {
    return this.http.post<ModerationLogEntry>(`${API_BASE}/moderation/cases/${caseId}/decision`, {
      decision,
      justification,
    });
  }

  history(objectType: string, objectId: string): Observable<ModerationLogEntry[]> {
    const params = new HttpParams().set('objectType', objectType).set('objectId', objectId);
    return this.http.get<ModerationLogEntry[]>(`${API_BASE}/moderation/history`, { params });
  }
}

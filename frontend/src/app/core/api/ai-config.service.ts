import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { AiConfig, UpdateAiConfigInput } from '../models';

/** Client de la configuration IA personnelle (ADR.16 / TSPEC.07). La clé n'est jamais renvoyée. */
@Injectable({ providedIn: 'root' })
export class AiConfigApi {
  private readonly http = inject(HttpClient);

  get(): Observable<AiConfig | null> {
    return this.http.get<AiConfig | null>(`${API_BASE}/me/ai-config`);
  }

  update(input: UpdateAiConfigInput): Observable<AiConfig> {
    return this.http.put<AiConfig>(`${API_BASE}/me/ai-config`, input);
  }

  test(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${API_BASE}/me/ai-config/test`, {});
  }
}

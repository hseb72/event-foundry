import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { AiConfig, AiProviderInfo, UpdateAiConfigInput } from '../models';

/** Client de la configuration IA personnelle (ADR.16 / TSPEC.07). La clé n'est jamais renvoyée. */
@Injectable({ providedIn: 'root' })
export class AiConfigApi {
  private readonly http = inject(HttpClient);

  /** Catalogue des fournisseurs (guidage UI : fournisseurs, modèles suggérés, lien clé). */
  providers(): Observable<AiProviderInfo[]> {
    return this.http.get<AiProviderInfo[]>(`${API_BASE}/ai/providers`);
  }

  get(): Observable<AiConfig | null> {
    return this.http.get<AiConfig | null>(`${API_BASE}/me/ai-config`);
  }

  update(input: UpdateAiConfigInput): Observable<AiConfig> {
    return this.http.put<AiConfig>(`${API_BASE}/me/ai-config`, input);
  }

  test(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${API_BASE}/me/ai-config/test`, {});
  }

  // --- Configuration IA d'organisation (organizer, organization.manage) ---

  getOrg(organizationId: string): Observable<AiConfig | null> {
    return this.http.get<AiConfig | null>(`${API_BASE}/identity/organizations/${organizationId}/ai-config`);
  }

  updateOrg(organizationId: string, input: UpdateAiConfigInput): Observable<AiConfig> {
    return this.http.put<AiConfig>(`${API_BASE}/identity/organizations/${organizationId}/ai-config`, input);
  }

  testOrg(organizationId: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(
      `${API_BASE}/identity/organizations/${organizationId}/ai-config/test`,
      {},
    );
  }
}

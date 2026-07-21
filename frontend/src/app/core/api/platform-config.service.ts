import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { AiCallStats, AiConfig, MailConfig, UpdateAiConfigInput, UpdateMailConfigInput } from '../models';

/** Client de la configuration plateforme Operator (FSPEC.09). Aucun secret n'est renvoyé en clair. */
@Injectable({ providedIn: 'root' })
export class PlatformConfigApi {
  private readonly http = inject(HttpClient);

  getMail(): Observable<MailConfig | null> {
    return this.http.get<MailConfig | null>(`${API_BASE}/admin/config/mail`);
  }

  updateMail(input: UpdateMailConfigInput): Observable<MailConfig> {
    return this.http.put<MailConfig>(`${API_BASE}/admin/config/mail`, input);
  }

  testMail(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${API_BASE}/admin/config/mail/test`, {});
  }

  getAi(): Observable<AiConfig | null> {
    return this.http.get<AiConfig | null>(`${API_BASE}/admin/config/ai`);
  }

  updateAi(input: UpdateAiConfigInput): Observable<AiConfig> {
    return this.http.put<AiConfig>(`${API_BASE}/admin/config/ai`, input);
  }

  testAi(): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${API_BASE}/admin/config/ai/test`, {});
  }

  /** Supervision des appels IA (volumes, taux d'échec, durée par fournisseur/cas). */
  aiStats(): Observable<AiCallStats> {
    return this.http.get<AiCallStats>(`${API_BASE}/admin/config/ai/stats`);
  }
}

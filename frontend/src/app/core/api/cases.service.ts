import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';

export interface CaseSummary {
  id: string;
  reference: string;
  type: string;
  domain: string;
  workQueue: string;
  status: string;
  priority: string;
  subject: string;
  createdAt: string;
  requester?: { displayName: string; email: string } | null;
  assignee?: { displayName: string } | null;
}

export interface CaseEventEntry {
  id: string;
  kind: string;
  body: string | null;
  visibility: string;
  occurredAt: string;
  metadata: Record<string, unknown> | null;
}

export interface CaseDetail extends CaseSummary {
  description: string;
  origin: string;
  events: CaseEventEntry[];
}

export interface CaseCatalog {
  types: string[];
  domains: string[];
  workQueues: string[];
  statuses: string[];
  priorities: string[];
}

export interface CaseDashboard {
  open: number;
  critical: number;
  byStatus: { status: string; count: number }[];
  byDomain: { domain: string; count: number }[];
}

/** Client Case Management (FSPEC.21) : ouverture de demandes + console Operator. */
@Injectable({ providedIn: 'root' })
export class CasesApi {
  private readonly http = inject(HttpClient);

  open(input: { type: string; subject: string; description: string }): Observable<CaseSummary> {
    return this.http.post<CaseSummary>(`${API_BASE}/cases`, input);
  }

  catalog(): Observable<CaseCatalog> {
    return this.http.get<CaseCatalog>(`${API_BASE}/cases/catalog`);
  }

  mine(): Observable<CaseSummary[]> {
    return this.http.get<CaseSummary[]>(`${API_BASE}/cases/mine`);
  }

  myCase(id: string): Observable<CaseDetail> {
    return this.http.get<CaseDetail>(`${API_BASE}/cases/mine/${id}`);
  }

  // Operator
  list(filter: Record<string, string>): Observable<CaseSummary[]> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(filter)) {
      if (v) {
        params = params.set(k, v);
      }
    }
    return this.http.get<CaseSummary[]>(`${API_BASE}/cases`, { params });
  }

  dashboard(): Observable<CaseDashboard> {
    return this.http.get<CaseDashboard>(`${API_BASE}/cases/dashboard`);
  }

  detail(id: string): Observable<CaseDetail> {
    return this.http.get<CaseDetail>(`${API_BASE}/cases/${id}`);
  }

  claim(id: string): Observable<CaseSummary> {
    return this.http.post<CaseSummary>(`${API_BASE}/cases/${id}/claim`, {});
  }

  setStatus(id: string, status: string): Observable<CaseSummary> {
    return this.http.patch<CaseSummary>(`${API_BASE}/cases/${id}/status`, { status });
  }

  setPriority(id: string, priority: string): Observable<CaseSummary> {
    return this.http.patch<CaseSummary>(`${API_BASE}/cases/${id}/priority`, { priority });
  }

  escalate(id: string, reason?: string): Observable<CaseSummary> {
    return this.http.post<CaseSummary>(`${API_BASE}/cases/${id}/escalate`, { reason });
  }

  comment(id: string, body: string, internal: boolean): Observable<{ added: boolean }> {
    return this.http.post<{ added: boolean }>(`${API_BASE}/cases/${id}/comments`, { body, internal });
  }
}

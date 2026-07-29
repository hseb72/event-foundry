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
  /** États atteignables depuis l'état courant (§11) — pour ne proposer que des transitions valides. */
  allowedTransitions?: string[];
}

export interface PaginatedCases {
  items: CaseSummary[];
  total: number;
  skip: number;
  take: number;
}

export interface CaseCatalog {
  types: string[];
  domains: string[];
  /** Origines possibles d'une Case (critère `origins` des règles de routage). */
  origins: string[];
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
  /** File Operator : filtrable, triable, paginée côté serveur. */
  list(filter: Record<string, string>): Observable<PaginatedCases> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(filter)) {
      if (v !== '' && v != null) {
        params = params.set(k, v);
      }
    }
    return this.http.get<PaginatedCases>(`${API_BASE}/cases`, { params });
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

  /** Changement d'état motivé : le commentaire est obligatoire (§11). */
  setStatus(id: string, status: string, comment: string): Observable<CaseSummary> {
    return this.http.patch<CaseSummary>(`${API_BASE}/cases/${id}/status`, { status, comment });
  }

  /** Re-route la Case vers un autre domaine / file (routage incorrect). Motif obligatoire. */
  reroute(id: string, domain: string, comment: string): Observable<CaseSummary> {
    return this.http.post<CaseSummary>(`${API_BASE}/cases/${id}/reroute`, { domain, comment });
  }

  /** Réponse du demandeur à sa propre demande (élément supplémentaire). */
  replyToMyCase(id: string, body: string): Observable<{ added: boolean }> {
    return this.http.post<{ added: boolean }>(`${API_BASE}/cases/mine/${id}/replies`, { body });
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

  // Routing Rules (§14)
  routingRules(): Observable<RoutingRule[]> {
    return this.http.get<RoutingRule[]>(`${API_BASE}/cases/routing-rules`);
  }

  createRule(rule: RoutingRuleInput): Observable<RoutingRule> {
    return this.http.post<RoutingRule>(`${API_BASE}/cases/routing-rules`, rule);
  }

  updateRule(id: string, rule: RoutingRuleInput): Observable<RoutingRule> {
    return this.http.patch<RoutingRule>(`${API_BASE}/cases/routing-rules/${id}`, rule);
  }

  deleteRule(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${API_BASE}/cases/routing-rules/${id}`);
  }
}

export interface RoutingRuleInput {
  name: string;
  orderIndex: number;
  isActive?: boolean;
  criteria: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface RoutingRule extends RoutingRuleInput {
  id: string;
}

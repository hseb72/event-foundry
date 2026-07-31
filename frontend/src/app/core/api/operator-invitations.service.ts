import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';

export interface OperatorInvitation {
  id: string;
  email: string;
  roleName: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

/** Invitations d'Operator par e-mail (FSPEC.17 §5). Réservé à `user.manage`. */
@Injectable({ providedIn: 'root' })
export class OperatorInvitationsApi {
  private readonly http = inject(HttpClient);

  invite(email: string, roleName?: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${API_BASE}/admin/operators/invitations`, { email, roleName });
  }

  pending(): Observable<OperatorInvitation[]> {
    return this.http.get<OperatorInvitation[]>(`${API_BASE}/admin/operators/invitations`);
  }

  cancel(id: string): Observable<{ cancelled: boolean }> {
    return this.http.delete<{ cancelled: boolean }>(`${API_BASE}/admin/operators/invitations/${id}`);
  }

  resend(id: string): Observable<{ resent: boolean }> {
    return this.http.post<{ resent: boolean }>(`${API_BASE}/admin/operators/invitations/${id}/resend`, {});
  }
}

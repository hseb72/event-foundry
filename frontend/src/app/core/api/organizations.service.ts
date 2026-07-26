import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';

export type OrgFunction = 'Owner' | 'Administrator' | 'Event Manager';

export interface MyOrganization {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  functions: string[];
}

export interface OrganizationMember {
  userId: string;
  displayName: string;
  email: string;
  functions: string[];
}

/** Client du domaine Organisations (FSPEC.19) : création, mes organisations, gestion des membres. */
@Injectable({ providedIn: 'root' })
export class OrganizationsApi {
  constructor(private readonly http: HttpClient) {}

  create(name: string): Observable<{ id: string; name: string; slug: string }> {
    return this.http.post<{ id: string; name: string; slug: string }>(`${API_BASE}/organizations`, { name });
  }

  mine(): Observable<MyOrganization[]> {
    return this.http.get<MyOrganization[]>(`${API_BASE}/organizations/mine`);
  }

  members(id: string): Observable<OrganizationMember[]> {
    return this.http.get<OrganizationMember[]>(`${API_BASE}/organizations/${id}/members`);
  }

  changeFunction(id: string, userId: string, fn: OrgFunction): Observable<{ updated: boolean }> {
    return this.http.patch<{ updated: boolean }>(
      `${API_BASE}/organizations/${id}/members/${userId}/function`,
      { function: fn },
    );
  }

  removeMember(id: string, userId: string): Observable<{ removed: boolean }> {
    return this.http.delete<{ removed: boolean }>(`${API_BASE}/organizations/${id}/members/${userId}`);
  }

  leave(id: string): Observable<{ left: boolean }> {
    return this.http.post<{ left: boolean }>(`${API_BASE}/organizations/${id}/leave`, {});
  }

  transfer(id: string, userId: string): Observable<{ transferred: boolean }> {
    return this.http.post<{ transferred: boolean }>(`${API_BASE}/organizations/${id}/transfer`, { userId });
  }

  // --- Invitations (FSPEC.19-B) ---

  invite(id: string, email: string, fn: OrgFunction): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${API_BASE}/organizations/${id}/invitations`, {
      email,
      function: fn,
    });
  }

  invitations(id: string): Observable<OrganizationInvitation[]> {
    return this.http.get<OrganizationInvitation[]>(`${API_BASE}/organizations/${id}/invitations`);
  }

  cancelInvitation(id: string, invitationId: string): Observable<{ cancelled: boolean }> {
    return this.http.delete<{ cancelled: boolean }>(
      `${API_BASE}/organizations/${id}/invitations/${invitationId}`,
    );
  }

  resendInvitation(id: string, invitationId: string): Observable<{ resent: boolean }> {
    return this.http.post<{ resent: boolean }>(
      `${API_BASE}/organizations/${id}/invitations/${invitationId}/resend`,
      {},
    );
  }

  acceptInvitation(token: string): Observable<{ organizationId: string; organizationName: string }> {
    return this.http.post<{ organizationId: string; organizationName: string }>(
      `${API_BASE}/invitations/accept`,
      { token },
    );
  }

  // --- Informations générales & activités couvertes (FSPEC.16) ---

  generalInfo(id: string): Observable<OrganizationGeneralInfo> {
    return this.http.get<OrganizationGeneralInfo>(`${API_BASE}/organizations/${id}`);
  }

  updateGeneralInfo(id: string, data: Partial<OrganizationGeneralInfo>): Observable<OrganizationGeneralInfo> {
    return this.http.patch<OrganizationGeneralInfo>(`${API_BASE}/organizations/${id}`, data);
  }

  setActivities(id: string, activityIds: string[]): Observable<{ updated: boolean }> {
    return this.http.put<{ updated: boolean }>(`${API_BASE}/organizations/${id}/activities`, {
      activityIds,
    });
  }
}

/** Informations générales d'une organisation (FSPEC.16 §4/§6). */
export interface OrganizationGeneralInfo {
  id: string;
  name: string;
  slug: string;
  contactEmail: string | null;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  createdById: string | null;
  subscriptionPlan: { key: string; name: string } | null;
  coveredActivities: { activity: { id: string; name: string } }[];
}

/** Invitation en attente (vue Owner/Administrator). */
export interface OrganizationInvitation {
  id: string;
  email: string;
  function: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

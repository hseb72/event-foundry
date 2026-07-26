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
}

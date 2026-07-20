import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { API_BASE } from '../api.config';
import { AuthService } from '../auth/auth.service';
import {
  AuthTokens,
  CreateOrganizationAddressInput,
  Experience,
  IdentityMe,
  OrganizationAddress,
  OrganizationAdmin,
} from '../models';

/**
 * Client du domaine Identity (TSPEC.06). Expose la vue « moi » dans un signal partagé et pilote
 * les changements de contexte (expérience / organisation). Chaque changement réémet des jetons
 * (nouveau contexte de permissions) appliqués via AuthService, puis recharge la vue « moi ».
 */
@Injectable({ providedIn: 'root' })
export class IdentityService {
  /** Identité effective courante (profil, rôles, permissions, expériences, organisations). */
  readonly me = signal<IdentityMe | null>(null);

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  loadMe(): Observable<IdentityMe> {
    return this.http
      .get<IdentityMe>(`${API_BASE}/identity/me`)
      .pipe(tap((me) => this.me.set(me)));
  }

  changeExperience(experience: Experience): Observable<IdentityMe> {
    return this.http
      .patch<AuthTokens>(`${API_BASE}/identity/me/experience`, { experience })
      .pipe(
        tap((tokens) => this.auth.applyTokens(tokens)),
        switchMap(() => this.loadMe()),
      );
  }

  switchOrganization(organizationId: string | null): Observable<IdentityMe> {
    return this.http
      .patch<AuthTokens>(`${API_BASE}/identity/me/organization`, { organizationId })
      .pipe(
        tap((tokens) => this.auth.applyTokens(tokens)),
        switchMap(() => this.loadMe()),
      );
  }

  updateProfile(input: { displayName?: string; preferences?: Record<string, unknown> }): Observable<IdentityMe> {
    return this.http
      .patch<IdentityMe>(`${API_BASE}/identity/me/profile`, input)
      .pipe(tap((me) => this.me.set(me)));
  }

  // --- Administration (permission user.manage côté Backend) ---

  listOrganizations(): Observable<OrganizationAdmin[]> {
    return this.http.get<OrganizationAdmin[]>(`${API_BASE}/identity/organizations`);
  }

  createOrganization(name: string, slug: string): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${API_BASE}/identity/organizations`, { name, slug });
  }

  addMember(organizationId: string, userId: string, role: string): Observable<void> {
    return this.http.post<void>(`${API_BASE}/identity/organizations/${organizationId}/members`, {
      userId,
      role,
    });
  }

  // --- Adresses d'organisation (organizer, permission organization.manage — chantier §8.2) ---

  listOrganizationAddresses(organizationId: string): Observable<OrganizationAddress[]> {
    return this.http.get<OrganizationAddress[]>(
      `${API_BASE}/identity/organizations/${organizationId}/addresses`,
    );
  }

  createOrganizationAddress(
    organizationId: string,
    input: CreateOrganizationAddressInput,
  ): Observable<OrganizationAddress> {
    return this.http.post<OrganizationAddress>(
      `${API_BASE}/identity/organizations/${organizationId}/addresses`,
      input,
    );
  }

  setPrimaryOrganizationAddress(
    organizationId: string,
    addressId: string,
  ): Observable<OrganizationAddress> {
    return this.http.post<OrganizationAddress>(
      `${API_BASE}/identity/organizations/${organizationId}/addresses/${addressId}/primary`,
      {},
    );
  }

  deleteOrganizationAddress(organizationId: string, addressId: string): Observable<void> {
    return this.http.delete<void>(
      `${API_BASE}/identity/organizations/${organizationId}/addresses/${addressId}`,
    );
  }

  assignRole(userId: string, role: string): Observable<void> {
    return this.http.post<void>(`${API_BASE}/identity/users/${userId}/roles`, { role });
  }

  revokeRole(userId: string, role: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/identity/users/${userId}/roles/${encodeURIComponent(role)}`);
  }
}

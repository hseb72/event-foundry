import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { AdminUserDto } from '../models';

/** Administration des utilisateurs (réservé ADMIN côté Backend). */
@Injectable({ providedIn: 'root' })
export class UsersAdminApi {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<AdminUserDto[]> {
    return this.http.get<AdminUserDto[]>(`${API_BASE}/users`);
  }

  setStatus(id: string, isActive: boolean): Observable<AdminUserDto> {
    return this.http.patch<AdminUserDto>(`${API_BASE}/users/${id}/status`, { isActive });
  }

  setRoles(id: string, roles: string[]): Observable<AdminUserDto> {
    return this.http.put<AdminUserDto>(`${API_BASE}/users/${id}/roles`, { roles });
  }
}

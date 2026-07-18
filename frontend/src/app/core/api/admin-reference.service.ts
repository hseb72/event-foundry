import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ReferentialItem } from '../models';

/** Une ligne de référentiel (champs communs + champs spécifiques accédés en indexé). */
export interface ReferenceRow {
  id: string;
  name: string;
  isActive: boolean;
  [key: string]: unknown;
}

/**
 * Accès CRUD générique aux référentiels (EPIC 11 / 12). Les mutations exigent le rôle ADMIN
 * côté Backend. La désactivation est logique (`is_active`), la réactivation passe par update.
 */
@Injectable({ providedIn: 'root' })
export class AdminReferenceApi {
  constructor(private readonly http: HttpClient) {}

  /** Liste incluant les entrées désactivées (vue admin). */
  list(segment: string): Observable<ReferenceRow[]> {
    return this.http.get<ReferenceRow[]>(`${API_BASE}/${segment}`, {
      params: { includeInactive: 'true' },
    });
  }

  create(segment: string, body: Record<string, unknown>): Observable<ReferenceRow> {
    return this.http.post<ReferenceRow>(`${API_BASE}/${segment}`, body);
  }

  update(segment: string, id: string, body: Record<string, unknown>): Observable<ReferenceRow> {
    return this.http.put<ReferenceRow>(`${API_BASE}/${segment}/${id}`, body);
  }

  deactivate(segment: string, id: string): Observable<ReferenceRow> {
    return this.http.delete<ReferenceRow>(`${API_BASE}/${segment}/${id}`);
  }

  /** Options d'un select parent (id/name), en incluant les inactifs pour l'admin. */
  options(source: string): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/${source}`, {
      params: { includeInactive: 'true' },
    });
  }
}

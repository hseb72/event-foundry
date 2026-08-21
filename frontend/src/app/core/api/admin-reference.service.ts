import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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

/** Page de référentiel (référentiels volumineux : pagination / tri / filtre côté serveur). */
export interface PaginatedReference {
  items: ReferenceRow[];
  total: number;
  skip: number;
  take: number;
}

/** Paramètres d'une requête paginée serveur. */
export interface ReferencePageQuery {
  includeInactive?: boolean;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  skip?: number;
  take?: number;
}

/**
 * Accès CRUD générique aux référentiels (EPIC 11 / 12). Les mutations exigent le rôle ADMIN
 * côté Backend. La désactivation est logique (`is_active`), la réactivation passe par update.
 */
@Injectable({ providedIn: 'root' })
export class AdminReferenceApi {
  private readonly http = inject(HttpClient);

  /** Liste incluant les entrées désactivées (vue admin). */
  list(segment: string): Observable<ReferenceRow[]> {
    return this.http.get<ReferenceRow[]>(`${API_BASE}/${segment}`, {
      params: { includeInactive: 'true' },
    });
  }

  /**
   * Page d'un référentiel volumineux (tri/filtre/pagination côté serveur — endpoint `<segment>/page`).
   * Inclut les entrées désactivées (vue admin).
   */
  listPaged(segment: string, query: ReferencePageQuery): Observable<PaginatedReference> {
    let params = new HttpParams().set('includeInactive', String(query.includeInactive ?? true));
    if (query.search) params = params.set('search', query.search);
    if (query.sort) params = params.set('sort', query.sort);
    if (query.order) params = params.set('order', query.order);
    if (query.skip != null) params = params.set('skip', String(query.skip));
    if (query.take != null) params = params.set('take', String(query.take));
    return this.http.get<PaginatedReference>(`${API_BASE}/${segment}/page`, { params });
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

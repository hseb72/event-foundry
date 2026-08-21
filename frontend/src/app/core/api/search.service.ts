import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { Facets, PaginatedEvents } from '../models';

/**
 * Client du domaine Search (TSPEC.09) : recherche plein texte indexée sur les événements publiés
 * et facettes contextuelles au texte recherché. Distinct de la découverte (`/events`), qui filtre
 * le catalogue sans classement de pertinence.
 */
@Injectable({ providedIn: 'root' })
export class SearchApi {
  private readonly http = inject(HttpClient);

  events(params: Record<string, string>): Observable<PaginatedEvents> {
    return this.http.get<PaginatedEvents>(`${API_BASE}/search/events`, { params });
  }

  facets(params: Record<string, string>): Observable<Facets> {
    return this.http.get<Facets>(`${API_BASE}/search/facets`, { params });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { Recommendation, RecommendationAction } from '../models';

/**
 * Client du moteur de recommandation déterministe (EPIC 06 / ADR.09). Chaque recommandation est
 * accompagnée de ses justifications ; le retour utilisateur (accepter / ignorer / refuser) affine
 * déterministiquement les propositions suivantes.
 */
@Injectable({ providedIn: 'root' })
export class RecommendationApi {
  private readonly http = inject(HttpClient);

  list(surprise = false, take = 10): Observable<Recommendation[]> {
    return this.http.get<Recommendation[]>(`${API_BASE}/me/recommendations`, {
      params: { surprise: String(surprise), take: String(take) },
    });
  }

  feedback(eventId: string, action: RecommendationAction): Observable<void> {
    return this.http.post<void>(`${API_BASE}/me/recommendations/${eventId}/feedback`, { action });
  }
}

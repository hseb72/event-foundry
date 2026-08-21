import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { EventDto } from '../models';

/** Coordonnées facultatives issues de la géolocalisation opt-in du navigateur. */
export interface VisitorCoords {
  latitude: number;
  longitude: number;
}

/**
 * Accès public (sans authentification) à la vitrine : événements « à la Une » pour la page de garde.
 * La position n'est transmise que si le visiteur l'autorise explicitement.
 */
@Injectable({ providedIn: 'root' })
export class PublicApi {
  private readonly http = inject(HttpClient);

  featured(take = 8, coords?: VisitorCoords): Observable<EventDto[]> {
    let params = new HttpParams().set('take', String(take));
    if (coords) {
      params = params.set('lat', String(coords.latitude)).set('lng', String(coords.longitude));
    }
    return this.http.get<EventDto[]>(`${API_BASE}/public/featured`, { params });
  }
}

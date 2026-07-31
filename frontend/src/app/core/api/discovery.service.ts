import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { EventDto, Facets } from '../models';

/** Client du domaine Discovery (TSPEC.04) : navigation à facettes et « Surprends-moi ». */
@Injectable({ providedIn: 'root' })
export class DiscoveryApi {
  constructor(private readonly http: HttpClient) {}

  facets(): Observable<Facets> {
    return this.http.get<Facets>(`${API_BASE}/discovery/facets`);
  }

  surprise(take = 6): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${API_BASE}/discovery/surprise`, {
      params: { take: String(take) },
    });
  }
}

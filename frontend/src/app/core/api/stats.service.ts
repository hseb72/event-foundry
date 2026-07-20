import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ImportStatsDto, PlatformOverviewDto } from '../models';

@Injectable({ providedIn: 'root' })
export class StatsApi {
  constructor(private readonly http: HttpClient) {}

  /** Vision globale de l'état de la plateforme (supervision Operator — OPE-001). */
  overview(): Observable<PlatformOverviewDto> {
    return this.http.get<PlatformOverviewDto>(`${API_BASE}/admin/overview`);
  }

  /** Statistiques du pipeline d'import (réservé ADMIN côté Backend). */
  importStats(): Observable<ImportStatsDto> {
    return this.http.get<ImportStatsDto>(`${API_BASE}/admin/import-stats`);
  }
}

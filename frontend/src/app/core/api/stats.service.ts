import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ImportStatsDto } from '../models';

@Injectable({ providedIn: 'root' })
export class StatsApi {
  constructor(private readonly http: HttpClient) {}

  /** Statistiques du pipeline d'import (réservé ADMIN côté Backend). */
  importStats(): Observable<ImportStatsDto> {
    return this.http.get<ImportStatsDto>(`${API_BASE}/admin/import-stats`);
  }
}

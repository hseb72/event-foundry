import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';

/** Volumétrie du référentiel géographique local. */
export interface GeoCounts {
  countries: number;
  regions: number;
  municipalities: number;
}

/** Statut de la (dernière) ingestion GeoNames + volumétrie courante. */
export interface GeoImportStatus {
  running: boolean;
  country: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  regionsUpserted: number | null;
  municipalitiesInserted: number | null;
  municipalitiesRead: number | null;
  error: string | null;
  counts: GeoCounts;
}

/**
 * Ingestion du référentiel géographique depuis GeoNames (TSPEC.03), déclenchée depuis
 * l'administration des référentiels. Traitement batch côté backend ; le front suit le statut.
 */
@Injectable({ providedIn: 'root' })
export class GeoImportApi {
  constructor(private readonly http: HttpClient) {}

  start(country: string): Observable<unknown> {
    return this.http.post(`${API_BASE}/admin/reference/geo-import`, { country });
  }

  status(): Observable<GeoImportStatus> {
    return this.http.get<GeoImportStatus>(`${API_BASE}/admin/reference/geo-import/status`);
  }
}

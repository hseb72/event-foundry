import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ActivityDto, ReferentialItem } from '../models';

@Injectable({ providedIn: 'root' })
export class ReferenceDataApi {
  constructor(private readonly http: HttpClient) {}

  activities(): Observable<ActivityDto[]> {
    return this.http.get<ActivityDto[]>(`${API_BASE}/activities`);
  }

  eventTypes(activityId: string): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/event-types`, {
      params: { activityId },
    });
  }

  eventFormats(activityId: string): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/event-formats`, {
      params: { activityId },
    });
  }

  organizers(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/organizers`);
  }

  venues(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/venues`);
  }

  categories(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/categories`);
  }

  tags(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/tags`);
  }

  countries(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/countries`);
  }

  regions(countryId: string): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/regions`, { params: { countryId } });
  }

  municipalities(regionId: string): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/municipalities`, { params: { regionId } });
  }
}

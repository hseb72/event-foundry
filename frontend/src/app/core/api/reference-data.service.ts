import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ActivityDto, MunicipalityGeo, ReferentialItem } from '../models';

@Injectable({ providedIn: 'root' })
export class ReferenceDataApi {
  constructor(private readonly http: HttpClient) {}

  activities(): Observable<ActivityDto[]> {
    return this.http.get<ActivityDto[]>(`${API_BASE}/activities`);
  }

  /** Domaines métier (pour créer une nouvelle activité — la hiérarchie Domain → Activity). */
  domains(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/domains`);
  }

  // --- Création de référentiels à la volée (validation d'un import — reference.manage) ---

  createActivity(name: string, domainId: string): Observable<ActivityDto> {
    return this.http.post<ActivityDto>(`${API_BASE}/activities`, { name, domainId });
  }

  /** Associe un libellé à une activité existante en créant un alias (apprentissage du moteur). */
  createActivityAlias(activityId: string, value: string): Observable<unknown> {
    return this.http.post(`${API_BASE}/activities/${activityId}/aliases`, { value });
  }

  createEventType(name: string, activityId: string): Observable<ReferentialItem> {
    return this.http.post<ReferentialItem>(`${API_BASE}/event-types`, { name, activityId });
  }

  createEventFormat(name: string, activityId: string): Observable<ReferentialItem> {
    return this.http.post<ReferentialItem>(`${API_BASE}/event-formats`, { name, activityId });
  }

  createOrganizer(name: string): Observable<ReferentialItem> {
    return this.http.post<ReferentialItem>(`${API_BASE}/organizers`, { name });
  }

  createVenue(name: string): Observable<ReferentialItem> {
    return this.http.post<ReferentialItem>(`${API_BASE}/venues`, { name });
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

  /** Résolution « pays + code postal → commune(s) » (Localisation V3, chantier §8.1). */
  resolveMunicipalities(countryId: string, postalCode: string): Observable<MunicipalityGeo[]> {
    return this.http.get<MunicipalityGeo[]>(`${API_BASE}/municipalities/resolve`, {
      params: { countryId, postalCode },
    });
  }

  /** Vue géographique d'une commune (région/pays dérivés) — préremplissage en édition. */
  municipalityGeo(id: string): Observable<MunicipalityGeo> {
    return this.http.get<MunicipalityGeo>(`${API_BASE}/municipalities/${id}/geo`);
  }
}

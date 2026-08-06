import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import {
  ActivityDto,
  FamilyDto,
  ModalityDimensionDto,
  MunicipalityGeo,
  ProvisionalEntry,
  ProvisionalType,
  ReferentialItem,
} from '../models';

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

  /** Type transverse (DATA.01 v2.0) : créé sans rattachement à une Activité. */
  createEventType(name: string): Observable<ReferentialItem> {
    return this.http.post<ReferentialItem>(`${API_BASE}/event-types`, { name });
  }

  createOrganizer(name: string): Observable<ReferentialItem> {
    return this.http.post<ReferentialItem>(`${API_BASE}/organizers`, { name });
  }

  createVenue(name: string): Observable<ReferentialItem> {
    return this.http.post<ReferentialItem>(`${API_BASE}/venues`, { name });
  }

  // --- File de curation des référentiels provisoires (ADR.24 — reference.manage) ---

  listProvisional(): Observable<ProvisionalEntry[]> {
    return this.http.get<ProvisionalEntry[]>(`${API_BASE}/admin/reference/provisional`);
  }

  confirmProvisional(type: ProvisionalType, id: string): Observable<void> {
    return this.http.post<void>(`${API_BASE}/admin/reference/provisional/confirm`, { type, id });
  }

  removeProvisional(type: ProvisionalType, id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/admin/reference/provisional`, { body: { type, id } });
  }

  /** Types d'événement : référentiel **transverse** (DATA.01 v2.0), indépendant de l'Activité. */
  eventTypes(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/event-types`);
  }

  organizers(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/organizers`);
  }

  venues(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/venues`);
  }

  tags(): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/tags`);
  }

  /** Sujets (Axe A — DATA.01 v2.0), filtrables par activité (via la Family parente). */
  subjects(activityId?: string): Observable<ReferentialItem[]> {
    return this.http.get<ReferentialItem[]>(`${API_BASE}/subjects`, {
      params: activityId ? { activityId } : {},
    });
  }

  /** Familles (Axe A — DATA.01 v2.0) : maillon Activity → Family → Subject. */
  families(activityId?: string): Observable<FamilyDto[]> {
    return this.http.get<FamilyDto[]>(`${API_BASE}/activity-families`, {
      params: activityId ? { activityId } : {},
    });
  }

  /** Dimensions de modalités avec leurs termes (Axe C — DATA.01 v2.0). */
  modalityDimensions(): Observable<ModalityDimensionDto[]> {
    return this.http.get<ModalityDimensionDto[]>(`${API_BASE}/modality-dimensions`);
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

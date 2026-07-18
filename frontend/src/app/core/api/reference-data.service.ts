import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ActivityDto } from '../models';

@Injectable({ providedIn: 'root' })
export class ReferenceDataApi {
  constructor(private readonly http: HttpClient) {}

  activities(): Observable<ActivityDto[]> {
    return this.http.get<ActivityDto[]>(`${API_BASE}/activities`);
  }
}

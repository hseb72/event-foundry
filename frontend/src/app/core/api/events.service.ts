import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { EventDto, PaginatedEvents } from '../models';

@Injectable({ providedIn: 'root' })
export class EventsApi {
  constructor(private readonly http: HttpClient) {}

  search(params: Record<string, string>): Observable<PaginatedEvents> {
    return this.http.get<PaginatedEvents>(`${API_BASE}/events`, { params });
  }

  calendar(params: Record<string, string>): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${API_BASE}/me/calendar`, { params });
  }

  getById(id: string): Observable<EventDto> {
    return this.http.get<EventDto>(`${API_BASE}/events/${id}`);
  }
}

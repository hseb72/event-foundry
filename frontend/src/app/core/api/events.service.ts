import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { CreateEventInput, EventDto, EventMediaDto, PaginatedEvents } from '../models';

@Injectable({ providedIn: 'root' })
export class EventsApi {
  constructor(private readonly http: HttpClient) {}

  create(body: CreateEventInput): Observable<EventDto> {
    return this.http.post<EventDto>(`${API_BASE}/events`, body);
  }

  search(params: Record<string, string>): Observable<PaginatedEvents> {
    return this.http.get<PaginatedEvents>(`${API_BASE}/events`, { params });
  }

  calendar(params: Record<string, string>): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${API_BASE}/me/calendar`, { params });
  }

  getById(id: string): Observable<EventDto> {
    return this.http.get<EventDto>(`${API_BASE}/events/${id}`);
  }

  archive(id: string): Observable<EventDto> {
    return this.http.post<EventDto>(`${API_BASE}/events/${id}/archive`, {});
  }

  restore(id: string): Observable<EventDto> {
    return this.http.post<EventDto>(`${API_BASE}/events/${id}/restore`, {});
  }

  uploadMedia(id: string, file: File): Observable<EventMediaDto> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<EventMediaDto>(`${API_BASE}/events/${id}/media`, form);
  }

  deleteMedia(id: string, mediaId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/events/${id}/media/${mediaId}`);
  }
}

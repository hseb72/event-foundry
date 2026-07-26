import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import {
  CreateEventInput,
  EventDto,
  EventEditValue,
  EventMediaDto,
  EventStatusEventDto,
  PaginatedEvents,
  PlanningEntry,
} from '../models';

@Injectable({ providedIn: 'root' })
export class EventsApi {
  constructor(private readonly http: HttpClient) {}

  create(body: CreateEventInput): Observable<EventDto> {
    return this.http.post<EventDto>(`${API_BASE}/events`, body);
  }

  search(params: Record<string, string>): Observable<PaginatedEvents> {
    return this.http.get<PaginatedEvents>(`${API_BASE}/events`, { params });
  }

  /** Événements privés de l'utilisateur courant (FSPEC.22 §15). */
  myPrivateEvents(): Observable<PaginatedEvents> {
    return this.http.get<PaginatedEvents>(`${API_BASE}/events/me/private`);
  }

  calendar(params: Record<string, string>): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${API_BASE}/me/calendar`, { params });
  }

  planning(params: Record<string, string> = {}): Observable<PlanningEntry[]> {
    return this.http.get<PlanningEntry[]>(`${API_BASE}/me/planning`, { params });
  }

  getById(id: string): Observable<EventDto> {
    return this.http.get<EventDto>(`${API_BASE}/events/${id}`);
  }

  /** Vue d'édition (référentiels par identifiant) pour préremplir le formulaire de correction. */
  getForEdit(id: string): Observable<EventEditValue> {
    return this.http.get<EventEditValue>(`${API_BASE}/events/${id}/edit`);
  }

  /** Corrige un événement éditable (brouillon / soumis). */
  update(id: string, body: CreateEventInput): Observable<EventDto> {
    return this.http.patch<EventDto>(`${API_BASE}/events/${id}`, body);
  }

  private transition(id: string, action: string): Observable<EventDto> {
    return this.http.post<EventDto>(`${API_BASE}/events/${id}/${action}`, {});
  }

  submit(id: string): Observable<EventDto> {
    return this.transition(id, 'submit');
  }

  publish(id: string): Observable<EventDto> {
    return this.transition(id, 'publish');
  }

  unpublish(id: string): Observable<EventDto> {
    return this.transition(id, 'unpublish');
  }

  archive(id: string): Observable<EventDto> {
    return this.transition(id, 'archive');
  }

  restore(id: string): Observable<EventDto> {
    return this.transition(id, 'restore');
  }

  history(id: string): Observable<EventStatusEventDto[]> {
    return this.http.get<EventStatusEventDto[]>(`${API_BASE}/events/${id}/history`);
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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ImportDetailDto, ImportResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ImportsApi {
  constructor(private readonly http: HttpClient) {}

  uploadFile(file: File): Observable<ImportResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImportResponse>(`${API_BASE}/imports`, form);
  }

  importText(text: string): Observable<ImportResponse> {
    return this.http.post<ImportResponse>(`${API_BASE}/imports/text`, { text });
  }

  /** Import structuré déterministe (CSV/JSON — canal de référence, sans OCR ni IA). */
  importStructured(content: string, format?: 'csv' | 'json'): Observable<ImportResponse> {
    return this.http.post<ImportResponse>(`${API_BASE}/imports/structured`, { content, format });
  }

  list(): Observable<ImportResponse[]> {
    return this.http.get<ImportResponse[]>(`${API_BASE}/imports`);
  }

  detail(id: string): Observable<ImportDetailDto> {
    return this.http.get<ImportDetailDto>(`${API_BASE}/imports/${id}`);
  }
}

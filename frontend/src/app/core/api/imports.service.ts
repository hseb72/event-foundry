import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from '../api.config';
import { ImportResponse } from '../models';

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

  list(): Observable<ImportResponse[]> {
    return this.http.get<ImportResponse[]>(`${API_BASE}/imports`);
  }
}

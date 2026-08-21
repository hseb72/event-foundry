import { HttpClient } from '@angular/common/http';
import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE } from '../api.config';
import { NotificationDto, NotificationPreferences, NotificationSettings } from '../models';

/**
 * Client des notifications internes (EPIC 08). Expose le nombre de non lues dans un signal partagé
 * pour le badge de navigation, rafraîchi après chaque action (lecture, suppression).
 */
@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);

  /** Nombre de notifications non lues (badge de navigation). */
  readonly unread = signal(0);

  list(status?: 'UNREAD' | 'READ'): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(`${API_BASE}/me/notifications`, {
      params: status ? { status } : {},
    });
  }

  refreshUnread(): void {
    this.http
      .get<{ count: number }>(`${API_BASE}/me/notifications/unread-count`)
      .subscribe({ next: (res) => this.unread.set(res.count), error: () => this.unread.set(0) });
  }

  markRead(id: string): Observable<void> {
    return this.http
      .post<void>(`${API_BASE}/me/notifications/${id}/read`, {})
      .pipe(tap(() => this.refreshUnread()));
  }

  markAllRead(): Observable<void> {
    return this.http
      .post<void>(`${API_BASE}/me/notifications/read-all`, {})
      .pipe(tap(() => this.unread.set(0)));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<void>(`${API_BASE}/me/notifications/${id}`)
      .pipe(tap(() => this.refreshUnread()));
  }

  // --- Préférences individuelles (Explorer) ---

  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${API_BASE}/me/notifications/preferences`);
  }

  updatePreferences(input: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(
      `${API_BASE}/me/notifications/preferences`,
      input,
    );
  }

  // --- Réglages globaux (Operator) ---

  getSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${API_BASE}/admin/config/notifications`);
  }

  updateSettings(input: NotificationSettings): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${API_BASE}/admin/config/notifications`, input);
  }
}

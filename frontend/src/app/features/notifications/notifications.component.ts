import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationsApi } from '../../core/api/notifications.service';
import { NotificationDto } from '../../core/models';
import { formatDateTime } from '../../shared/date-format';

/**
 * Notifications internes de l'utilisateur (UISPEC EXP-006). Liste les messages (non lus en tête),
 * permet de marquer comme lu / tout lire / supprimer, et de rebondir vers l'événement concerné.
 */
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterLink],
  styles: [
    `
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        margin-bottom: 1.25rem;
      }
      .list {
        display: grid;
        gap: 0.5rem;
      }
      .notif {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.75rem 0.9rem;
      }
      .notif.unread {
        border-left: 4px solid var(--accent);
        background: rgba(124, 58, 237, 0.04);
      }
      .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        margin-top: 0.35rem;
        background: var(--accent);
        flex: 0 0 auto;
      }
      .notif.read .dot {
        background: var(--border);
      }
      .body {
        flex: 1 1 auto;
      }
      .title {
        font-weight: 600;
      }
      .text {
        color: var(--text);
        font-size: 0.9rem;
      }
      .meta {
        color: var(--muted);
        font-size: 0.78rem;
        margin-top: 0.2rem;
      }
      .actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .btn-sm {
        padding: 0.25rem 0.55rem;
        font-size: 0.78rem;
      }
      .empty {
        color: var(--muted);
        padding: 2rem 0;
      }
    `,
  ],
  template: `
    <div class="head">
      <h1>Notifications</h1>
      @if (notifications.length && unreadCount() > 0) {
        <button class="btn" (click)="readAll()">Tout marquer comme lu</button>
      }
    </div>

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else if (notifications.length === 0) {
      <p class="empty">Aucune notification pour le moment.</p>
    } @else {
      <div class="list">
        @for (notif of notifications; track notif.id) {
          <div class="notif" [class.unread]="notif.status === 'UNREAD'" [class.read]="notif.status === 'READ'">
            <span class="dot"></span>
            <div class="body">
              <div class="title">{{ notif.title }}</div>
              <div class="text">{{ notif.body }}</div>
              <div class="meta">{{ date(notif) }}</div>
            </div>
            <div class="actions">
              @if (notif.eventId) {
                <a class="btn btn-sm" [routerLink]="['/events', notif.eventId]">Voir</a>
              }
              @if (notif.status === 'UNREAD') {
                <button class="btn btn-sm" (click)="read(notif)">Lu</button>
              }
              <button class="btn btn-sm" (click)="remove(notif)">Supprimer</button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(NotificationsApi);

  notifications: NotificationDto[] = [];
  loading = true;
  readonly unreadCount = this.api.unread;

  ngOnInit(): void {
    this.load();
    this.api.refreshUnread();
  }

  date(notif: NotificationDto): string {
    return formatDateTime(notif.createdAt);
  }

  read(notif: NotificationDto): void {
    notif.status = 'READ';
    this.api.markRead(notif.id).subscribe({ error: () => this.load() });
  }

  readAll(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, status: 'READ' as const }));
    this.api.markAllRead().subscribe({ error: () => this.load() });
  }

  remove(notif: NotificationDto): void {
    this.notifications = this.notifications.filter((n) => n.id !== notif.id);
    this.api.remove(notif.id).subscribe({ error: () => this.load() });
  }

  private load(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (items) => {
        this.notifications = items;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}

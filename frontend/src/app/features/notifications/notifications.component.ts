import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotificationsApi } from '../../core/api/notifications.service';
import { NotificationDto, NotificationPreferences, NotificationVectorChoice } from '../../core/models';
import { formatDateTime } from '../../shared/date-format';

/**
 * Notifications internes de l'utilisateur (UISPEC EXP-006). Liste les messages (non lus en tête),
 * permet de marquer comme lu / tout lire / supprimer, et de rebondir vers l'événement concerné.
 */
@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [RouterLink, FormsModule],
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
        border-left: 4px solid var(--exp);
        background: rgba(124, 58, 237, 0.04);
      }
      .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        margin-top: 0.35rem;
        background: var(--exp);
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
      <div style="display:flex;gap:0.5rem">
        <button class="btn" (click)="showPrefs = !showPrefs">Préférences</button>
        @if (notifications.length && unreadCount() > 0) {
          <button class="btn" (click)="readAll()">Tout marquer comme lu</button>
        }
      </div>
    </div>

    @if (showPrefs && prefs) {
      <div class="card" style="margin-bottom:1rem">
        <h3 style="margin-top:0">Préférences de diffusion</h3>
        <p class="muted" style="font-size:0.82rem">
          L'historique reste toujours consultable ici (canal interne). Choisissez, pour chaque
          fréquence, comment être averti à l'extérieur.
        </p>
        @for (t of tracks; track t.key) {
          <div style="display:grid;grid-template-columns:1fr auto;gap:0.6rem;align-items:center;margin:0.4rem 0">
            <label>{{ t.label }}</label>
            <select class="select" [ngModel]="prefs[t.key]" (ngModelChange)="setTrack(t.key, $event)"
                    style="max-width:180px">
              <option value="none">Aucun</option>
              <option value="email">E-mail</option>
              <option value="push">Push</option>
            </select>
          </div>
        }
        <div style="margin-top:0.6rem;display:flex;gap:0.6rem;align-items:center">
          <button class="btn btn-primary" (click)="savePrefs()">Enregistrer</button>
          @if (prefsSaved) { <span class="muted" style="font-size:0.82rem">✓ Enregistré</span> }
        </div>
      </div>
    }

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

  // Préférences de diffusion (Explorer — FSPEC.04).
  showPrefs = false;
  prefs: NotificationPreferences | null = null;
  prefsSaved = false;
  readonly tracks: { key: keyof NotificationPreferences; label: string }[] = [
    { key: 'immediate', label: 'Immédiat' },
    { key: 'daily', label: 'Récap quotidien' },
    { key: 'weekly', label: 'Récap hebdomadaire' },
  ];

  ngOnInit(): void {
    this.load();
    this.api.refreshUnread();
    this.api.getPreferences().subscribe((prefs) => (this.prefs = prefs));
  }

  setTrack(key: keyof NotificationPreferences, value: NotificationVectorChoice): void {
    if (this.prefs) {
      this.prefs = { ...this.prefs, [key]: value };
      this.prefsSaved = false;
    }
  }

  savePrefs(): void {
    if (!this.prefs) {
      return;
    }
    this.api.updatePreferences(this.prefs).subscribe((saved) => {
      this.prefs = saved;
      this.prefsSaved = true;
    });
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

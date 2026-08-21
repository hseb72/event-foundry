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
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
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

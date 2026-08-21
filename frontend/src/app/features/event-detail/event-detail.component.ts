import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
import { ModerationApi } from '../../core/api/moderation.service';
import { ParticipationApi } from '../../core/api/participation.service';
import { AiConfigApi } from '../../core/api/ai-config.service';
import { AuthService } from '../../core/auth/auth.service';
import { EventDto, ParticipationState, PaymentStatus, ReservationStatus } from '../../core/models';
import { formatDateTime } from '../../shared/date-format';
import { FollowButtonComponent } from '../../shared/follow-button.component';
import { participationColor, participationLabel } from '../../shared/participation-color';
import { eventCoverBackground } from '../../shared/event-cover';

/** Fiche détaillée d'un Event (EPIC 11). Consultation complète + actions de participation. */
@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, FollowButtonComponent],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
})
export class EventDetailComponent implements OnInit {
  event: EventDto | null = null;
  loading = true;
  /** Une action de la barre (duplication) est en cours : évite les doubles envois. */
  actionBusy = false;
  participation: ParticipationState = {
    interested: false,
    reservationStatus: 'NONE',
    paymentStatus: 'NONE',
  };

  private readonly auth = inject(AuthService);
  private readonly aiConfigApi = inject(AiConfigApi);
  private readonly router = inject(Router);

  // Cas d'usage IA « texte » activés par l'utilisateur (assistance à l'affichage — ADR.16).
  private aiEnabled: Record<string, boolean> = {};
  readonly aiBusy = signal(false);
  readonly aiResult = signal<{ label: string; text: string; provider: string | null } | null>(null);
  readonly aiEmpty = signal(false);

  // Signalement (FSPEC.20)
  private readonly moderation = inject(ModerationApi);
  readonly reportOpen = signal(false);
  readonly reportRef = signal('');
  reportReason = 'INCORRECT_INFO';
  reportDetails = '';

  // Notification d'un Organizer enregistré (FSPEC.22 §16)
  notifyBusy = false;
  notifyDone = false;
  notifyOrgName = '';

  notifyOrganizer(): void {
    if (!this.event || this.notifyBusy) {
      return;
    }
    this.notifyBusy = true;
    this.eventsApi.notifyOrganizer(this.event.id).subscribe({
      next: (res) => {
        this.notifyBusy = false;
        this.notifyDone = true;
        this.notifyOrgName = res.organizationName;
      },
      error: () => (this.notifyBusy = false),
    });
  }

  submitReport(): void {
    if (!this.event) {
      return;
    }
    this.moderation
      .report({ objectType: 'EVENT', objectId: this.event.id, reason: this.reportReason, details: this.reportDetails.trim() })
      .subscribe({
        next: (res) => this.reportRef.set(res.reference),
        error: () => this.reportRef.set(''),
      });
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly eventsApi: EventsApi,
    private readonly participationApi: ParticipationApi,
  ) {}

  canTranslate(): boolean {
    return this.aiEnabled['TRANSLATE'] === true;
  }

  canSummarize(): boolean {
    return this.aiEnabled['SUMMARIZE'] === true;
  }

  assist(useCase: 'TRANSLATE' | 'SUMMARIZE', text: string): void {
    this.aiBusy.set(true);
    this.aiEmpty.set(false);
    this.aiResult.set(null);
    this.aiConfigApi.assist({ useCase, text }).subscribe({
      next: (result) => {
        this.aiBusy.set(false);
        if (result.assisted && result.text) {
          const label = useCase === 'TRANSLATE' ? 'Traduction (IA)' : 'Résumé (IA)';
          this.aiResult.set({ label, text: result.text, provider: result.provider });
        } else {
          this.aiEmpty.set(true);
        }
      },
      error: () => {
        this.aiBusy.set(false);
        this.aiEmpty.set(true);
      },
    });
  }

  statusLabel(): string {
    const map: Record<string, string> = { DRAFT: 'Brouillon', PUBLISHED: 'Publié', ARCHIVED: 'Archivé' };
    return this.event ? (map[this.event.status] ?? this.event.status) : '';
  }

  canArchive(): boolean {
    return this.auth.hasPermission('event.archive');
  }

  canRestore(): boolean {
    return this.auth.hasPermission('event.publish');
  }

  canUpdate(): boolean {
    return this.auth.hasPermission('event.update');
  }

  /**
   * Vrai si la galerie est modifiable depuis cette fiche. Un événement **privé** appartient à celui
   * qui le consulte — la fiche ne lui est servie que dans ce cas (garde serveur) : l'illustrer est
   * self-service, sans le droit `event.update` réservé à la curation du catalogue.
   */
  canManageMedia(): boolean {
    return this.event?.visibility === 'PRIVATE' ? true : this.canUpdate();
  }

  /** Vrai si l'événement peut être corrigé depuis cette fiche (droit + statut éditable). */
  canEditHere(): boolean {
    const event = this.event;
    if (!event) {
      return false;
    }
    const editableStatus = event.status === 'DRAFT' || event.status === 'SUBMITTED';
    return editableStatus && (event.visibility === 'PRIVATE' ? true : this.canUpdate());
  }

  /**
   * Correction de **cet** événement (même identifiant). Un événement privé se corrige dans l'espace
   * personnel ; les autres passent par le formulaire d'édition de l'espace Organizer.
   */
  edit(): void {
    const event = this.event;
    if (!event) {
      return;
    }
    if (event.visibility === 'PRIVATE') {
      void this.router.navigate(['/my-events'], { queryParams: { edit: event.id } });
      return;
    }
    void this.router.navigate(['/events', event.id, 'edit']);
  }

  /**
   * Duplication : crée **immédiatement** une copie (nouvel identifiant, brouillon) reprenant toutes
   * les caractéristiques de cet événement, puis ouvre la correction de la copie. L'original reste
   * intact. La copie est personnelle pour un événement privé (ou faute de droit de création), sinon
   * elle rejoint l'organisation active.
   */
  duplicate(): void {
    const event = this.event;
    if (!event || this.actionBusy) {
      return;
    }
    const asPrivate = event.visibility === 'PRIVATE' || !this.auth.hasPermission('event.create');
    this.actionBusy = true;
    const request = asPrivate
      ? this.eventsApi.duplicateAsPrivate(event.id)
      : this.eventsApi.duplicate(event.id);
    request.subscribe({
      next: (copy) => {
        this.actionBusy = false;
        void (asPrivate
          ? this.router.navigate(['/my-events'], { queryParams: { edit: copy.id } })
          : this.router.navigate(['/events', copy.id, 'edit']));
      },
      error: () => (this.actionBusy = false),
    });
  }

  onFile(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    const event = this.event;
    if (!file || !event) {
      return;
    }
    // Un événement privé passe par la route self-service (propriété), les autres par la curation.
    const request =
      event.visibility === 'PRIVATE'
        ? this.eventsApi.uploadPrivateMedia(event.id, file)
        : this.eventsApi.uploadMedia(event.id, file);
    request.subscribe((media) => {
      event.media.push(media);
      // Première image ajoutée : elle devient la couverture, sans recharger la fiche.
      event.coverUrl ??= media.url;
      input.value = '';
    });
  }

  removeMedia(mediaId: string): void {
    const event = this.event;
    if (!event) {
      return;
    }
    const request =
      event.visibility === 'PRIVATE'
        ? this.eventsApi.deletePrivateMedia(event.id, mediaId)
        : this.eventsApi.deleteMedia(event.id, mediaId);
    request.subscribe(() => {
      event.media = event.media.filter((m) => m.id !== mediaId);
      event.coverUrl = event.media.find((m) => m.contentType?.startsWith('image/'))?.url ?? null;
    });
  }

  archive(): void {
    if (!this.event) {
      return;
    }
    this.eventsApi.archive(this.event.id).subscribe((event) => (this.event = event));
  }

  restore(): void {
    if (!this.event) {
      return;
    }
    this.eventsApi.restore(this.event.id).subscribe((event) => (this.event = event));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    this.eventsApi.getById(id).subscribe({
      next: (event) => {
        this.event = event;
        if (event.participation) {
          this.participation = { ...event.participation };
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
    // Cas d'usage IA activés (pour n'afficher les boutons que si pertinent).
    this.aiConfigApi.get().subscribe((config) => {
      this.aiEnabled = config?.enabled ? { ...config.useCases } : {};
    });
  }

  /** Fond de la couverture — logique partagée (image de couverture, sinon dégradé festif). */
  coverBg(): string {
    return eventCoverBackground(this.event);
  }

  /** Sous-titre incrusté sur la couverture : date · activité · type. */
  coverSub(): string {
    const event = this.event;
    if (!event) {
      return '';
    }
    const parts = [formatDateTime(event.startsAt), event.activity];
    if (event.eventType) {
      parts.push(event.eventType);
    }
    return parts.join(' · ');
  }

  color(): string {
    return participationColor(this.participation);
  }

  label(): string {
    return participationLabel(this.participation);
  }

  dateRange(): string {
    if (!this.event) {
      return '';
    }
    const start = formatDateTime(this.event.startsAt);
    return this.event.endsAt ? `${start} → ${formatDateTime(this.event.endsAt)}` : start;
  }

  toggleInterested(): void {
    this.save({ interested: !this.participation.interested });
  }

  onReservation(value: ReservationStatus): void {
    this.save({ reservationStatus: value });
  }

  onPayment(value: PaymentStatus): void {
    this.save({ paymentStatus: value });
  }

  private save(body: {
    interested?: boolean;
    reservationStatus?: ReservationStatus;
    paymentStatus?: PaymentStatus;
  }): void {
    if (!this.event) {
      return;
    }
    this.participationApi.update(this.event.id, body).subscribe((response) => {
      this.participation = {
        interested: response.interested,
        reservationStatus: response.reservationStatus,
        paymentStatus: response.paymentStatus,
      };
    });
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventsApi } from '../../core/api/events.service';
import { ModerationApi } from '../../core/api/moderation.service';
import { ParticipationApi } from '../../core/api/participation.service';
import { AiConfigApi } from '../../core/api/ai-config.service';
import { AuthService } from '../../core/auth/auth.service';
import { EventDto, ParticipationState, PaymentStatus, ReservationStatus } from '../../core/models';
import { formatDateTime } from '../../shared/date-format';
import { FollowButtonComponent } from '../../shared/follow-button.component';
import { participationColor, participationLabel } from '../../shared/participation-color';

/** Fiche détaillée d'un Event (EPIC 11). Consultation complète + actions de participation. */
@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, FollowButtonComponent],
  styles: [
    `
      .back {
        display: inline-block;
        margin-bottom: 1rem;
        color: var(--muted);
      }
      .head {
        border-left: 6px solid var(--stripe, transparent);
        padding-left: 1rem;
      }
      h1 {
        margin-bottom: 0.25rem;
      }
      .badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.06);
        vertical-align: middle;
        margin-left: 0.5rem;
      }
      .badge.archived {
        background: rgba(220, 38, 38, 0.14);
        color: var(--red);
      }
      .badge.private {
        background: rgba(37, 99, 235, 0.14);
        color: var(--exp, #2563eb);
      }
      .notify-org {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        background: var(--surface-2);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.6rem 0.9rem;
        margin: 0.6rem 0 0;
        font-size: 0.88rem;
      }
      .notify-org span {
        flex: 1;
        min-width: 12rem;
      }
      .notify-org .done {
        color: var(--green, #16a34a);
        font-weight: 600;
        flex: 0 0 auto;
      }
      .chip {
        display: inline-block;
        padding: 0.1rem 0.5rem;
        margin: 0.1rem 0.2rem 0.1rem 0;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        background: var(--bg);
        border: 1px solid var(--border);
      }
      .admin-actions {
        display: flex;
        gap: 0.5rem;
        margin: 0.5rem 0 0.25rem;
      }
      .gallery {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin: 1rem 0;
      }
      .shot {
        position: relative;
        margin: 0;
      }
      .shot img {
        width: 160px;
        height: 120px;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid var(--border);
      }
      .shot .rm {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 0;
        background: var(--red);
        color: #fff;
        cursor: pointer;
        line-height: 1;
      }
      .upload {
        width: 160px;
        height: 120px;
        border: 1px dashed var(--border);
        border-radius: 10px;
        display: grid;
        place-items: center;
        cursor: pointer;
        color: var(--muted);
        font-size: 0.85rem;
        text-align: center;
        padding: 0 0.5rem;
      }
      .upload:hover {
        border-color: var(--exp);
        color: var(--exp);
      }
      dl {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 0.5rem 1rem;
        margin: 1.25rem 0;
      }
      dt {
        color: var(--muted);
        font-weight: 600;
      }
      .desc {
        white-space: pre-wrap;
        line-height: 1.5;
      }
      .loc-line {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .ai-tools {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
        margin: 0.5rem 0;
      }
      .ai-out {
        border: 1px solid var(--border);
        border-left: 4px solid var(--exp);
        border-radius: 10px;
        padding: 0.7rem 0.9rem;
        background: var(--surface-2);
        margin-top: 0.4rem;
      }
      .ai-out-head {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-weight: 700;
        font-size: 0.82rem;
        margin-bottom: 0.35rem;
      }
      .ai-close {
        margin-left: auto;
        border: 0;
        background: transparent;
        color: var(--muted);
        cursor: pointer;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        margin-top: 1rem;
      }
      .actions select {
        padding: 0.35rem 0.5rem;
        border-radius: 8px;
        border: 1px solid var(--border);
      }
      .state {
        font-weight: 700;
      }
    `,
  ],
  template: `
    <a class="back" routerLink="/discover">← Retour</a>

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else if (!event) {
      <p class="muted">Événement introuvable.</p>
    } @else {
      <div class="head card" [style.--stripe]="color()">
        <h1>
          {{ event.title }}
          <span class="badge">{{ event.source === 'IMPORT' ? 'Importé' : 'Manuel' }}</span>
          <span class="badge" [class.archived]="event.status === 'ARCHIVED'">{{ statusLabel() }}</span>
          @if (event.visibility === 'PRIVATE') {
            <span class="badge private" title="Événement personnel, visible de vous seul">🔒 Privé</span>
          }
        </h1>

        @if (event.visibility === 'PRIVATE' && event.canNotifyOrganizer) {
          <div class="notify-org">
            <span>
              Cet événement mentionne un organisateur enregistré. Vous pouvez l'informer qu'un
              événement le concernant existe (sans lui céder cet événement privé).
            </span>
            @if (notifyDone) {
              <span class="done">✓ Organisateur notifié{{ notifyOrgName ? ' — ' + notifyOrgName : '' }}</span>
            } @else {
              <button class="btn" [disabled]="notifyBusy" (click)="notifyOrganizer()">
                {{ notifyBusy ? 'Envoi…' : "Notifier l'organisateur" }}
              </button>
            }
          </div>
        }

        <dl>
          <dt>Date</dt>
          <dd>{{ dateRange() }}</dd>

          <dt>Activité</dt>
          <dd>
            <span class="loc-line">
              <span>
                {{ event.activity }}
                @if (event.eventType) {
                  · {{ event.eventType }}
                }
                @if (event.eventFormat) {
                  · {{ event.eventFormat }}
                }
              </span>
              <app-follow-button targetType="ACTIVITY" [targetId]="event.activityId" />
            </span>
          </dd>

          @if (event.category) {
            <dt>Catégorie</dt>
            <dd>
              <span class="loc-line">
                <span>{{ event.category }}</span>
                @if (event.categoryId) {
                  <app-follow-button targetType="CATEGORY" [targetId]="event.categoryId" />
                }
              </span>
            </dd>
          }
          @if (event.organizer) {
            <dt>Organisateur</dt>
            <dd>
              <span class="loc-line">
                <span>{{ event.organizer }}</span>
                @if (event.organizerId) {
                  <app-follow-button targetType="ORGANIZER" [targetId]="event.organizerId" />
                }
              </span>
            </dd>
          }
          @if (event.venue || event.city) {
            <dt>Lieu</dt>
            <dd>
              <span class="loc-line">
                <span>{{ event.venue }}{{ event.venue && event.city ? ' — ' : '' }}{{ event.city }}</span>
                @if (event.venueId) {
                  <app-follow-button targetType="VENUE" [targetId]="event.venueId" />
                }
              </span>
            </dd>
          }
          @if (event.municipality) {
            <dt>Commune</dt>
            <dd>{{ event.municipality }}{{ event.region ? ', ' + event.region : '' }}{{ event.country ? ' (' + event.country + ')' : '' }}</dd>
          }
          @if (event.price !== null) {
            <dt>Prix</dt>
            <dd>{{ event.price }} {{ event.currency ?? 'EUR' }}</dd>
          }
          @if (event.tags.length) {
            <dt>Tags</dt>
            <dd>
              @for (t of event.tags; track t) {
                <span class="chip">{{ t }}</span>
              }
            </dd>
          }
        </dl>

        @if (event.description) {
          <p class="desc">{{ event.description }}</p>
          @if (canTranslate() || canSummarize()) {
            <div class="ai-tools">
              @if (canTranslate()) {
                <button class="btn" [disabled]="aiBusy()" (click)="assist('TRANSLATE', event.description!)">🌐 Traduire</button>
              }
              @if (canSummarize()) {
                <button class="btn" [disabled]="aiBusy()" (click)="assist('SUMMARIZE', event.description!)">✂️ Résumer</button>
              }
              @if (aiBusy()) { <span class="muted">Assistance IA…</span> }
            </div>
            @if (aiResult(); as r) {
              <div class="ai-out">
                <div class="ai-out-head">
                  <span>{{ r.label }}</span>
                  @if (r.provider) { <span class="muted">· {{ r.provider }}</span> }
                  <button class="ai-close" (click)="aiResult.set(null)" title="Fermer">✕</button>
                </div>
                <p class="desc" style="margin:0">{{ r.text }}</p>
              </div>
            }
            @if (aiEmpty()) {
              <p class="muted" style="font-size:0.82rem">
                Aucune IA activée pour ce cas d'usage — configurez-la dans votre profil.
              </p>
            }
          }
        }

        @if (event.media.length || canUpdate()) {
          <div class="gallery">
            @for (m of event.media; track m.id) {
              <figure class="shot">
                <img [src]="m.url" [alt]="event.title" />
                @if (canUpdate()) {
                  <button class="rm" title="Supprimer" (click)="removeMedia(m.id)">×</button>
                }
              </figure>
            }
            @if (canUpdate()) {
              <label class="upload">
                <input type="file" accept="image/*" hidden (change)="onFile($event)" />
                <span>+ Ajouter une image</span>
              </label>
            }
          </div>
        }

        @if (canArchive() || canRestore()) {
          <div class="admin-actions">
            @if (event.status !== 'ARCHIVED' && canArchive()) {
              <button class="btn" (click)="archive()">Archiver</button>
            }
            @if (event.status === 'ARCHIVED' && canRestore()) {
              <button class="btn btn-primary" (click)="restore()">Restaurer</button>
            }
          </div>
        }

        <div class="actions">
          <button class="btn" [class.active]="participation.interested" (click)="toggleInterested()">
            {{ participation.interested ? 'Intéressé ✓' : 'Je suis intéressé' }}
          </button>

          <select [(ngModel)]="participation.reservationStatus" (ngModelChange)="onReservation($event)">
            <option value="NONE">Réservation…</option>
            <option value="RESERVED">Réservé</option>
            <option value="WAITLIST">Liste d'attente</option>
            <option value="CANCELLED">Annulé</option>
          </select>

          <select [(ngModel)]="participation.paymentStatus" (ngModelChange)="onPayment($event)">
            <option value="NONE">Paiement…</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Payé</option>
            <option value="REFUNDED">Remboursé</option>
          </select>

          <span class="state" [style.color]="color()">{{ label() }}</span>
        </div>

        <div style="margin-top:0.8rem">
          @if (!reportOpen()) {
            <button class="btn" style="font-size:0.82rem" (click)="reportOpen.set(true)">⚑ Signaler</button>
          } @else if (reportRef()) {
            <p class="muted" style="font-size:0.85rem">Merci — signalement {{ reportRef() }} transmis à la modération.</p>
          } @else {
            <div style="display:grid;gap:0.4rem;max-width:340px">
              <select [(ngModel)]="reportReason">
                <option value="INCORRECT_INFO">Information incorrecte</option>
                <option value="OFFENSIVE">Contenu offensant</option>
                <option value="DUPLICATE">Doublon</option>
                <option value="SPAM">Spam</option>
                <option value="FRAUD">Fraude</option>
                <option value="OTHER">Autre</option>
              </select>
              <textarea class="input" [(ngModel)]="reportDetails" placeholder="Détails (facultatif)"></textarea>
              <div style="display:flex;gap:0.5rem">
                <button class="btn btn-primary" style="font-size:0.82rem" (click)="submitReport()">Envoyer le signalement</button>
                <button class="btn" style="font-size:0.82rem" (click)="reportOpen.set(false)">Annuler</button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class EventDetailComponent implements OnInit {
  event: EventDto | null = null;
  loading = true;
  participation: ParticipationState = {
    interested: false,
    reservationStatus: 'NONE',
    paymentStatus: 'NONE',
  };

  private readonly auth = inject(AuthService);
  private readonly aiConfigApi = inject(AiConfigApi);

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

  onFile(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.event) {
      return;
    }
    this.eventsApi.uploadMedia(this.event.id, file).subscribe((media) => {
      this.event?.media.push(media);
      input.value = '';
    });
  }

  removeMedia(mediaId: string): void {
    if (!this.event) {
      return;
    }
    const eventId = this.event.id;
    this.eventsApi.deleteMedia(eventId, mediaId).subscribe(() => {
      if (this.event) {
        this.event.media = this.event.media.filter((m) => m.id !== mediaId);
      }
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

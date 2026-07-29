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
      /* Fiche sans padding : la couverture est pleine largeur, le contenu vit dans .body. */
      .head {
        padding: 0;
        overflow: hidden;
      }
      /* Bandeau de couverture festif : image de l'événement, sinon dégradé de repli déterministe. */
      .cover {
        position: relative;
        height: 210px;
        background-size: cover;
        background-position: center;
      }
      .cover::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 0.55));
      }
      .cover .top {
        position: absolute;
        top: 0.8rem;
        left: 0.9rem;
        right: 0.9rem;
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        z-index: 1;
      }
      .cover .bottom {
        position: absolute;
        left: 1.1rem;
        right: 1.1rem;
        bottom: 0.9rem;
        z-index: 1;
      }
      .cover h1 {
        margin: 0;
        color: #fff;
        font-size: 1.7rem;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
      }
      .cover .sub {
        color: rgba(255, 255, 255, 0.92);
        font-size: 0.9rem;
        margin-top: 0.25rem;
        text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
      }
      /* Filet de participation (remplace l'ancienne bordure gauche) — palette planning. */
      .filet {
        height: 5px;
        background: var(--stripe, transparent);
      }
      .body {
        padding: 1.1rem 1.25rem 1.35rem;
      }
      .badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        color: #1f2333;
        vertical-align: middle;
        backdrop-filter: blur(4px);
      }
      .badge.archived {
        background: rgba(220, 38, 38, 0.92);
        color: #fff;
      }
      .badge.private {
        background: rgba(37, 99, 235, 0.92);
        color: #fff;
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
        <!-- Bandeau de couverture festif : 1ʳᵉ image de l'événement, sinon dégradé de repli. -->
        <div class="cover" [style.background]="coverBg()">
          <div class="top">
            <span class="badge">{{ event.source === 'IMPORT' ? 'Importé' : 'Manuel' }}</span>
            <span class="badge" [class.archived]="event.status === 'ARCHIVED'">{{ statusLabel() }}</span>
            @if (event.visibility === 'PRIVATE') {
              <span class="badge private" title="Événement personnel, visible de vous seul">🔒 Privé</span>
            }
          </div>
          <div class="bottom">
            <h1>{{ event.title }}</h1>
            <div class="sub">{{ coverSub() }}</div>
          </div>
        </div>
        <div class="filet"></div>
        <div class="body">

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
                @if (event.modalities.length) {
                  · {{ event.modalities.join(' · ') }}
                }
              </span>
              <app-follow-button targetType="ACTIVITY" [targetId]="event.activityId" />
            </span>
          </dd>

          @if (event.subjects.length) {
            <dt>Sujets</dt>
            <dd>
              @for (subject of event.subjects; track subject; let i = $index) {
                <span class="loc-line">
                  <span>{{ subject }}</span>
                  @if (event.subjectIds[i]) {
                    <app-follow-button targetType="SUBJECT" [targetId]="event.subjectIds[i]" />
                  }
                </span>
              }
            </dd>
          }
          @if (event.modalities.length) {
            <dt>Modalités</dt>
            <dd>
              @for (m of event.modalities; track m) {
                <span class="chip">{{ m }}</span>
              }
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

        <div class="admin-actions">
          <!-- Duplication : ouvre le formulaire de création prérempli (nouvel événement au final). -->
          @if (canEditHere()) {
            <button class="btn" [disabled]="actionBusy" title="Corriger cet événement" (click)="edit()">✏️ Modifier</button>
          }
          <button class="btn" [disabled]="actionBusy" title="Créer une copie puis la modifier" (click)="duplicate()">📄 Dupliquer</button>
          @if (event.status !== 'ARCHIVED' && canArchive()) {
            <button class="btn" (click)="archive()">Archiver</button>
          }
          @if (event.status === 'ARCHIVED' && canRestore()) {
            <button class="btn btn-primary" (click)="restore()">Restaurer</button>
          }
        </div>

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
      </div>
    }
  `,
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

  /** Dégradés festifs (déclinés de la marque) pour la couverture d'un événement sans image. */
  private static readonly PLACEHOLDERS = [
    'linear-gradient(135deg, #f97316, #ec4899)',
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #6366f1, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
  ];

  /** Fond de la couverture : 1ʳᵉ image de l'événement, sinon dégradé festif déterministe (par id). */
  coverBg(): string {
    const event = this.event;
    if (!event) {
      return EventDetailComponent.PLACEHOLDERS[0];
    }
    const image = event.media?.find((m) => m.contentType?.startsWith('image/')) ?? event.media?.[0];
    if (image) {
      return `center / cover no-repeat url("${image.url}")`;
    }
    let hash = 0;
    for (const ch of event.id) hash = (hash + ch.charCodeAt(0)) | 0;
    const list = EventDetailComponent.PLACEHOLDERS;
    return list[Math.abs(hash) % list.length];
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

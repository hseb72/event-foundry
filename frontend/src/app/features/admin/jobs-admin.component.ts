import { Component, OnInit } from '@angular/core';
import { ImportsApi } from '../../core/api/imports.service';
import { ImportDetailDto, ImportResponse } from '../../core/models';
import { formatDateTime } from '../../shared/date-format';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  OCR_RUNNING: 'OCR en cours',
  OCR_DONE: 'OCR terminé',
  CLASSIFICATION_RUNNING: 'Classification',
  READY_FOR_VALIDATION: 'Prêt à valider',
  COMPLETED: 'Terminé',
  FAILED: 'Échec',
};

/** Administration des imports : liste globale + journal des transitions (EPIC 12, ADMIN). */
@Component({
  selector: 'app-jobs-admin',
  standalone: true,
  styles: [
    `
      .split {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1.5rem;
        align-items: start;
      }
      .list {
        display: grid;
        gap: 0.5rem;
      }
      .item {
        text-align: left;
        width: 100%;
        padding: 0.7rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--card, #fff);
        cursor: pointer;
      }
      .item.selected {
        border-color: var(--exp);
        box-shadow: 0 0 0 1px var(--exp);
      }
      .item small {
        color: var(--muted);
      }
      .badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.45rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.06);
      }
      dl {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 0.4rem 1rem;
        margin: 0 0 1rem;
      }
      dt {
        color: var(--muted);
        font-weight: 600;
      }
      .timeline {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .timeline li {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 0.6rem;
        padding: 0.35rem 0;
        border-bottom: 1px dashed var(--border);
        font-size: 0.9rem;
      }
      .timeline .when {
        color: var(--muted);
      }
      .ocr {
        white-space: pre-wrap;
        font-family: ui-monospace, monospace;
        font-size: 0.8rem;
        max-height: 220px;
        overflow: auto;
        background: rgba(0, 0, 0, 0.04);
        padding: 0.7rem;
        border-radius: 8px;
      }
      .empty {
        color: var(--muted);
        padding: 2rem 0;
      }
      @media (max-width: 760px) {
        .split {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `
    <h1>Imports</h1>
    <p class="muted">Suivi du pipeline : états, transitions et OCR.</p>

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else if (jobs.length === 0) {
      <p class="empty">Aucun import.</p>
    } @else {
      <div class="split">
        <div class="list">
          @for (job of jobs; track job.id) {
            <button class="item" [class.selected]="selected?.id === job.id" (click)="select(job)">
              <span class="badge">{{ label(job.status) }}</span>
              <div>{{ job.type === 'TEXT' ? 'Texte' : 'Image' }} · {{ job.candidateCount }} candidat(s)</div>
              <small>{{ format(job.createdAt) }}</small>
            </button>
          }
        </div>

        <div>
          @if (detailLoading) {
            <p class="muted">Chargement du détail…</p>
          } @else if (selected) {
            <div class="card">
              <dl>
                <dt>Statut</dt>
                <dd>{{ label(selected.status) }}</dd>
                <dt>Type</dt>
                <dd>{{ selected.type === 'TEXT' ? 'Texte' : 'Image' }}</dd>
                <dt>Candidats</dt>
                <dd>{{ selected.candidateCount }}</dd>
                <dt>Durée totale</dt>
                <dd>{{ totalDuration() }}</dd>
                @if (selected.ocr) {
                  <dt>Moteur OCR</dt>
                  <dd>
                    {{ selected.ocr.engine }} {{ selected.ocr.engineVersion }}
                    @if (selected.ocr.confidence !== null) {
                      · confiance {{ percent(selected.ocr.confidence) }}
                    }
                    @if (selected.ocr.language) {
                      · {{ selected.ocr.language }}
                    }
                  </dd>
                }
              </dl>

              <h3>Transitions</h3>
              <ul class="timeline">
                @for (event of selected.timeline; track $index) {
                  <li>
                    <span class="when">{{ format(event.occurredAt) }}</span>
                    <span>{{ label(event.status) }}</span>
                  </li>
                }
                @if (selected.timeline.length === 0) {
                  <li><span class="muted">Aucune transition enregistrée.</span></li>
                }
              </ul>

              @if (selected.ocrText) {
                <h3>Texte OCR</h3>
                <div class="ocr">{{ selected.ocrText }}</div>
              }
            </div>
          } @else {
            <p class="muted">Sélectionnez un import à gauche.</p>
          }
        </div>
      </div>
    }
  `,
})
export class JobsAdminComponent implements OnInit {
  jobs: ImportResponse[] = [];
  selected: ImportDetailDto | null = null;
  loading = true;
  detailLoading = false;

  constructor(private readonly api: ImportsApi) {}

  ngOnInit(): void {
    this.api.list().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  select(job: ImportResponse): void {
    this.detailLoading = true;
    this.selected = null;
    this.api.detail(job.id).subscribe({
      next: (detail) => {
        this.selected = detail;
        this.detailLoading = false;
      },
      error: () => (this.detailLoading = false),
    });
  }

  label(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  format(iso: string): string {
    return formatDateTime(iso);
  }

  percent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  totalDuration(): string {
    if (!this.selected?.startedAt || !this.selected?.finishedAt) {
      return '—';
    }
    const ms = new Date(this.selected.finishedAt).getTime() - new Date(this.selected.startedAt).getTime();
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
  }
}

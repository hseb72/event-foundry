import { Component, OnInit } from '@angular/core';
import { StatsApi } from '../../core/api/stats.service';
import { ImportStatsDto } from '../../core/models';

interface BarRow {
  label: string;
  value: number;
}

const IMPORT_STATUS_LABELS: [string, string][] = [
  ['PENDING', 'En attente'],
  ['OCR_RUNNING', 'OCR en cours'],
  ['OCR_DONE', 'OCR terminé'],
  ['CLASSIFICATION_RUNNING', 'Classification'],
  ['READY_FOR_VALIDATION', 'Prêt à valider'],
  ['COMPLETED', 'Terminé'],
  ['FAILED', 'Échec'],
];

const CANDIDATE_STATUS_LABELS: [string, string][] = [
  ['PENDING', 'En attente'],
  ['CORRECTED', 'Corrigé'],
  ['VALIDATED', 'Validé'],
  ['REJECTED', 'Rejeté'],
];

const SOURCE_LABELS: [string, string][] = [
  ['IMPORT', 'Importé'],
  ['MANUAL', 'Manuel'],
];

/**
 * Tableau de bord Admin du pipeline d'import (EPIC 11). Exploite le journal des transitions
 * (import_job_events) pour visualiser les passages entre états et les durées par étape.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  styles: [
    `
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.9rem;
        margin: 1rem 0 1.5rem;
      }
      .tile {
        padding: 1rem;
      }
      .tile .value {
        font-size: 1.8rem;
        font-weight: 800;
      }
      .tile .caption {
        color: var(--muted);
        font-size: 0.85rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.25rem;
      }
      h3 {
        margin: 0 0 0.75rem;
      }
      .bar-row {
        display: grid;
        grid-template-columns: 130px 1fr 40px;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
      }
      .track {
        background: rgba(0, 0, 0, 0.06);
        border-radius: 999px;
        height: 12px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        background: var(--accent);
        border-radius: 999px;
        min-width: 2px;
      }
      .count {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-weight: 600;
      }
      .muted {
        color: var(--muted);
      }
    `,
  ],
  template: `
    <h1>Tableau de bord</h1>
    <p class="muted">Pipeline d'import — volumes, passages entre états et durées.</p>

    @if (loading) {
      <p class="muted">Chargement…</p>
    } @else if (!stats) {
      <p class="muted">Statistiques indisponibles.</p>
    } @else {
      <div class="tiles">
        <div class="card tile">
          <div class="value">{{ stats.totalImports }}</div>
          <div class="caption">Imports</div>
        </div>
        <div class="card tile">
          <div class="value">{{ stats.totalCandidates }}</div>
          <div class="caption">Candidats</div>
        </div>
        <div class="card tile">
          <div class="value">{{ stats.totalEvents }}</div>
          <div class="caption">Événements</div>
        </div>
        <div class="card tile">
          <div class="value">{{ formatMs(stats.durations.avgOcrProcessingMs) }}</div>
          <div class="caption">Durée OCR moyenne</div>
        </div>
        <div class="card tile">
          <div class="value">{{ formatMs(stats.durations.avgTotalMs) }}</div>
          <div class="caption">Durée totale moyenne ({{ stats.durations.sampleCount }})</div>
        </div>
      </div>

      <div class="grid">
        <div class="card">
          <h3>Imports par état</h3>
          @for (row of importRows; track row.label) {
            <div class="bar-row">
              <span>{{ row.label }}</span>
              <span class="track"><span class="fill" [style.width.%]="pct(row.value, importMax)"></span></span>
              <span class="count">{{ row.value }}</span>
            </div>
          }
        </div>

        <div class="card">
          <h3>Passages entre états <span class="muted">(cumul)</span></h3>
          @for (row of transitionRows; track row.label) {
            <div class="bar-row">
              <span>{{ row.label }}</span>
              <span class="track"><span class="fill" [style.width.%]="pct(row.value, transitionMax)"></span></span>
              <span class="count">{{ row.value }}</span>
            </div>
          }
        </div>

        <div class="card">
          <h3>Candidats par état</h3>
          @for (row of candidateRows; track row.label) {
            <div class="bar-row">
              <span>{{ row.label }}</span>
              <span class="track"><span class="fill" [style.width.%]="pct(row.value, candidateMax)"></span></span>
              <span class="count">{{ row.value }}</span>
            </div>
          }
        </div>

        <div class="card">
          <h3>Événements par provenance</h3>
          @for (row of sourceRows; track row.label) {
            <div class="bar-row">
              <span>{{ row.label }}</span>
              <span class="track"><span class="fill" [style.width.%]="pct(row.value, sourceMax)"></span></span>
              <span class="count">{{ row.value }}</span>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  stats: ImportStatsDto | null = null;
  loading = true;

  importRows: BarRow[] = [];
  transitionRows: BarRow[] = [];
  candidateRows: BarRow[] = [];
  sourceRows: BarRow[] = [];
  importMax = 1;
  transitionMax = 1;
  candidateMax = 1;
  sourceMax = 1;

  constructor(private readonly api: StatsApi) {}

  ngOnInit(): void {
    this.api.importStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.importRows = toRows(stats.importsByStatus, IMPORT_STATUS_LABELS);
        this.transitionRows = toRows(stats.transitionsByStatus, IMPORT_STATUS_LABELS);
        this.candidateRows = toRows(stats.candidatesByStatus, CANDIDATE_STATUS_LABELS);
        this.sourceRows = toRows(stats.eventsBySource, SOURCE_LABELS);
        this.importMax = maxOf(this.importRows);
        this.transitionMax = maxOf(this.transitionRows);
        this.candidateMax = maxOf(this.candidateRows);
        this.sourceMax = maxOf(this.sourceRows);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  pct(value: number, max: number): number {
    return max <= 0 ? 0 : Math.round((value / max) * 100);
  }

  formatMs(ms: number | null): string {
    if (ms === null) {
      return '—';
    }
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
  }
}

function toRows(source: Record<string, number>, labels: [string, string][]): BarRow[] {
  return labels.map(([key, label]) => ({ label, value: source[key] ?? 0 }));
}

function maxOf(rows: BarRow[]): number {
  return rows.reduce((m, r) => Math.max(m, r.value), 0);
}

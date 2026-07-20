import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatsApi } from '../../core/api/stats.service';
import { ImportStatsDto, PlatformOverviewDto } from '../../core/models';

const EVENT_STATUS_LABELS: [string, string][] = [
  ['DRAFT', 'Brouillons'],
  ['SUBMITTED', 'En validation'],
  ['PUBLISHED', 'Publiés'],
  ['ARCHIVED', 'Archivés'],
];

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
  imports: [RouterLink],
  styles: [
    `
      .alerts {
        display: grid;
        gap: 0.6rem;
        margin: 0.5rem 0 1.5rem;
      }
      .alert {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        border-radius: 10px;
        padding: 0.7rem 0.9rem;
        border: 1px solid var(--border);
      }
      .alert.warn {
        border-left: 4px solid #e08600;
        background: rgba(224, 134, 0, 0.06);
      }
      .alert.ok {
        border-left: 4px solid var(--green, #2e7d32);
        background: rgba(46, 125, 50, 0.05);
      }
      .alert a {
        margin-left: auto;
        color: var(--exp);
        font-weight: 600;
        font-size: 0.85rem;
      }
      .section-title {
        font-size: 1.05rem;
        margin: 1.5rem 0 0.25rem;
      }
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
        background: var(--exp);
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
    <h1>Supervision</h1>
    <p class="muted">Vision globale de l'état de la plateforme.</p>

    @if (overview) {
      <div class="alerts">
        @if (overview.pendingValidations > 0) {
          <div class="alert warn">
            <span>⚠ {{ overview.pendingValidations }} candidat(s) d'import en attente de validation.</span>
            <a routerLink="/validation">Traiter</a>
          </div>
        }
        @if (overview.failedImports > 0) {
          <div class="alert warn">
            <span>⚠ {{ overview.failedImports }} import(s) en échec.</span>
            <a routerLink="/admin/jobs">Voir les imports</a>
          </div>
        }
        @if (overview.pendingValidations === 0 && overview.failedImports === 0) {
          <div class="alert ok"><span>✓ Aucune alerte : le pipeline est sain.</span></div>
        }
      </div>

      <div class="tiles">
        <div class="card tile">
          <div class="value">{{ overview.totalUsers }}</div>
          <div class="caption">Utilisateurs ({{ overview.activeUsers }} actifs · {{ overview.suspendedUsers }} suspendus)</div>
        </div>
        <div class="card tile">
          <div class="value">{{ overview.organizations }}</div>
          <div class="caption">Organisations</div>
        </div>
        <div class="card tile">
          <div class="value">{{ overview.totalEvents }}</div>
          <div class="caption">Événements</div>
        </div>
        @for (row of eventRows; track row.label) {
          <div class="card tile">
            <div class="value">{{ row.value }}</div>
            <div class="caption">{{ row.label }}</div>
          </div>
        }
      </div>
    }

    <h2 class="section-title">Pipeline d'import</h2>
    <p class="muted">Volumes, passages entre états et durées.</p>

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
  overview: PlatformOverviewDto | null = null;
  eventRows: BarRow[] = [];
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
    this.api.overview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.eventRows = toRows(overview.eventsByStatus, EVENT_STATUS_LABELS);
      },
    });
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

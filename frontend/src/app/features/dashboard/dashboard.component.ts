import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatsApi } from '../../core/api/stats.service';
import { PlatformConfigApi } from '../../core/api/platform-config.service';
import { AiCallStats, ImportStatsDto, PlatformOverviewDto } from '../../core/models';

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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
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

  /** Observabilité des appels IA (RG-AI-04) : monitoring, distinct de la configuration. */
  aiStats: AiCallStats | null = null;

  constructor(
    private readonly api: StatsApi,
    private readonly platformConfig: PlatformConfigApi,
  ) {}

  ngOnInit(): void {
    this.loadAiStats();
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

  loadAiStats(): void {
    this.platformConfig.aiStats().subscribe((stats) => (this.aiStats = stats));
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

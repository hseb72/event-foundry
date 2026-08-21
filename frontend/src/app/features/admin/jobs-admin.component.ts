import { Component, OnInit, inject } from '@angular/core';
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
  // Statuts du pipeline unifié V3 (canaux structuré / URL).
  DISCOVERING: 'Découverte',
  FETCHING: 'Récupération',
  EXTRACTING: 'Extraction',
  VALIDATING: 'Validation',
  NORMALIZING: 'Normalisation',
  DEDUPLICATING: 'Déduplication',
  PERSISTING: 'Enregistrement',
};

/** Administration des imports : liste globale + journal des transitions (EPIC 12, ADMIN). */
@Component({
  selector: 'app-jobs-admin',
  standalone: true,
  templateUrl: './jobs-admin.component.html',
  styleUrl: './jobs-admin.component.css',
})
export class JobsAdminComponent implements OnInit {
  private readonly api = inject(ImportsApi);

  jobs: ImportResponse[] = [];
  selected: ImportDetailDto | null = null;
  loading = true;
  detailLoading = false;
  replaying = false;
  replayMessage = '';

  replay(): void {
    if (!this.selected) {
      return;
    }
    this.replaying = true;
    this.replayMessage = '';
    const id = this.selected.id;
    this.api.replay(id).subscribe({
      next: (result) => {
        this.replaying = false;
        this.replayMessage = `Rejoué : ${result.rawEventCount} Raw Event(s).`;
        this.api.detail(id).subscribe((detail) => (this.selected = detail));
      },
      error: (err) => {
        this.replaying = false;
        this.replayMessage = err?.error?.message ?? 'Rejeu impossible pour cet import.';
      },
    });
  }

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
    this.replayMessage = '';
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

  /** Vrai si l'extraction OCR a été assistée par IA (moteur « ai:<provider> »). */
  isAiEngine(engine: string | null): boolean {
    return engine != null && engine.startsWith('ai:');
  }

  totalDuration(): string {
    if (!this.selected?.startedAt || !this.selected?.finishedAt) {
      return '—';
    }
    const ms =
      new Date(this.selected.finishedAt).getTime() - new Date(this.selected.startedAt).getTime();
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
  }
}

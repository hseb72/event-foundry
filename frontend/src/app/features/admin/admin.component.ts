import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReferenceCrudComponent } from './reference-crud.component';
import { EntityDef, REFERENCE_ENTITIES } from './reference-admin.model';
import { GeoImportApi, GeoImportStatus } from '../../core/api/geo-import.service';

/** Administration des référentiels (EPIC 11 / 12) : ingestion géo (GeoNames) + onglets CRUD par entité. */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReferenceCrudComponent, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit, OnDestroy {
  private readonly geoImport = inject(GeoImportApi);

  readonly entities = REFERENCE_ENTITIES;
  selected: EntityDef = REFERENCE_ENTITIES[0];

  country = 'FR';
  readonly status = signal<GeoImportStatus | null>(null);
  readonly running = signal(false);
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
  }

  select(entity: EntityDef): void {
    this.selected = entity;
  }

  startImport(): void {
    const country = this.country.trim().toUpperCase();
    if (country.length !== 2 || this.running()) {
      return;
    }
    this.running.set(true);
    this.geoImport.start(country).subscribe({
      next: () => this.poll(),
      error: () => {
        this.running.set(false);
        this.refresh();
      },
    });
  }

  refresh(): void {
    this.geoImport.status().subscribe({
      next: (status) => this.applyStatus(status),
    });
  }

  private applyStatus(status: GeoImportStatus): void {
    this.status.set(status);
    this.running.set(status.running);
    if (status.running) {
      this.poll();
    }
  }

  /** Interroge le statut toutes les 2s tant que l'ingestion tourne (traitement de fond). */
  private poll(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    this.pollTimer = setTimeout(() => {
      this.geoImport.status().subscribe({
        next: (status) => this.applyStatus(status),
        error: () => this.running.set(false),
      });
    }, 2000);
  }
}

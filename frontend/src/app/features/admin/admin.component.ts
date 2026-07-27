import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReferenceCrudComponent } from './reference-crud.component';
import { EntityDef, REFERENCE_ENTITIES } from './reference-admin.model';
import { GeoImportApi, GeoImportStatus } from '../../core/api/geo-import.service';

/** Administration des référentiels (EPIC 11 / 12) : ingestion géo (GeoNames) + onglets CRUD par entité. */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReferenceCrudComponent, FormsModule],
  styles: [
    `
      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 1rem 0 1.5rem;
      }
      .tab {
        padding: 0.5rem 0.9rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: var(--card, #fff);
        cursor: pointer;
        font-weight: 500;
      }
      .tab.active {
        background: var(--exp);
        color: #fff;
        border-color: var(--exp);
      }
      .geo {
        margin: 1rem 0 0.5rem;
      }
      .geo h2 {
        font-size: 1rem;
        margin: 0 0 0.3rem;
      }
      .geo-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
        margin: 0.6rem 0;
      }
      .geo-row .input {
        max-width: 90px;
        text-transform: uppercase;
      }
      .counts {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
      }
      .err {
        color: var(--red, #c0392b);
      }
    `,
  ],
  template: `
    <h1>Administration des référentiels</h1>
    <p class="muted">
      Gérez les domaines, activités, types, formats, organisateurs, lieux, la géographie
      (pays / régions / communes), les catégories et les tags.
    </p>

    <div class="card geo">
      <h2>Référentiel géographique (GeoNames)</h2>
      <p class="muted" style="font-size:0.82rem;margin:0">
        Les communes sont un référentiel <strong>local</strong> alimenté depuis GeoNames : le service
        n'est jamais impacté par une indisponibilité de GeoNames. L'ingestion est un traitement de fond ;
        ré-exécutable, elle n'ajoute que les nouveautés et conserve l'existant.
      </p>

      <div class="geo-row">
        <label class="muted" style="font-size:0.82rem">Pays (code ISO)</label>
        <input class="input" [(ngModel)]="country" maxlength="2" placeholder="FR" />
        <button class="btn btn-primary" [disabled]="running() || country.trim().length !== 2" (click)="startImport()">
          {{ running() ? 'Ingestion en cours…' : 'Importer depuis GeoNames' }}
        </button>
        <button class="btn" (click)="refresh()" [disabled]="running()">Rafraîchir</button>
      </div>

      @if (status(); as s) {
        <p class="muted" style="font-size:0.82rem;margin:0.2rem 0">
          Référentiel local :
          <span class="counts">{{ s.counts.countries }}</span> pays ·
          <span class="counts">{{ s.counts.regions }}</span> régions ·
          <span class="counts">{{ s.counts.municipalities }}</span> communes.
        </p>
        @if (s.running) {
          <p style="font-size:0.82rem;margin:0.2rem 0">⏳ Ingestion de {{ s.country }} en cours…</p>
        } @else if (s.error) {
          <p class="err" style="font-size:0.82rem;margin:0.2rem 0">
            ✗ Dernière ingestion ({{ s.country }}) en échec : {{ s.error }}
            <span class="muted">— le référentiel existant est conservé.</span>
          </p>
        } @else if (s.finishedAt) {
          <p style="font-size:0.82rem;margin:0.2rem 0">
            ✓ Dernière ingestion {{ s.country }} : {{ s.regionsUpserted }} régions,
            {{ s.municipalitiesInserted }} communes ajoutées ({{ s.municipalitiesRead }} lues).
          </p>
        }
      }
    </div>

    <div class="tabs">
      @for (e of entities; track e.segment) {
        <button class="tab" [class.active]="selected.segment === e.segment" (click)="select(e)">
          {{ e.label }}
        </button>
      }
    </div>

    <div class="card">
      <app-reference-crud [entity]="selected" />
    </div>
  `,
})
export class AdminComponent implements OnInit, OnDestroy {
  readonly entities = REFERENCE_ENTITIES;
  selected: EntityDef = REFERENCE_ENTITIES[0];

  country = 'FR';
  readonly status = signal<GeoImportStatus | null>(null);
  readonly running = signal(false);
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly geoImport: GeoImportApi) {}

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

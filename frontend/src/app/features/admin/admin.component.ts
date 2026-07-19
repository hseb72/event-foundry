import { Component } from '@angular/core';
import { ReferenceCrudComponent } from './reference-crud.component';
import { EntityDef, REFERENCE_ENTITIES } from './reference-admin.model';

/** Administration des référentiels (EPIC 11 / 12) : onglets + CRUD générique par entité. */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReferenceCrudComponent],
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
        background: var(--accent);
        color: #fff;
        border-color: var(--accent);
      }
    `,
  ],
  template: `
    <h1>Administration des référentiels</h1>
    <p class="muted">
      Gérez les domaines, activités, types, formats, organisateurs, lieux, la géographie
      (pays / régions / villes), les catégories et les tags.
    </p>

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
export class AdminComponent {
  readonly entities = REFERENCE_ENTITIES;
  selected: EntityDef = REFERENCE_ENTITIES[0];

  select(entity: EntityDef): void {
    this.selected = entity;
  }
}

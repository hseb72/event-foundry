import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModerationApi, ModerationTerm } from '../../core/api/moderation.service';
import { DataColumn, DataTableComponent } from '../../shared/data-table.component';

/**
 * Référentiel des termes de modération (FSPEC.22 §13 / FSPEC.20). Les Operators gèrent la liste des
 * termes interdits / spam qui alimente les contrôles automatiques déterministes de soumission.
 * Aucune liste métier n'est codée en dur (règle d'or n°1).
 */
@Component({
  selector: 'app-moderation-terms',
  standalone: true,
  imports: [FormsModule, DataTableComponent],
  styles: [
    `
      .intro { color: var(--muted); margin: 0 0 1rem; }
      .add { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
      input, select {
        border: 1px solid var(--border); border-radius: 8px; padding: 0.45rem 0.6rem;
        font: inherit; background: var(--bg); color: var(--text);
      }
      .badge { font-size: 0.72rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 999px; }
      .badge.banned { color: var(--red); background: rgba(220, 38, 38, 0.14); }
      .badge.spam { color: #b45309; background: rgba(234, 179, 8, 0.15); }
      .off { opacity: 0.5; }
      .muted { color: var(--muted); }
    `,
  ],
  template: `
    <h1>Termes de modération</h1>
    <p class="intro">
      Ces termes alimentent les <strong>contrôles automatiques</strong> des soumissions (§13). Un terme
      actif détecté dans un événement soumis ouvre un dossier de modération. La détection est
      déterministe (aucune décision par IA).
    </p>

    <div class="add">
      <input [(ngModel)]="term" placeholder="Terme (ex. arnaque)" />
      <select [(ngModel)]="kind">
        <option value="BANNED">Interdit</option>
        <option value="SPAM">Spam</option>
      </select>
      <button class="btn btn-primary" [disabled]="!term.trim()" (click)="add()">Ajouter</button>
    </div>

    @if (message()) { <p class="muted">{{ message() }}</p> }

    @if (!terms().length) {
      <p class="muted">Aucun terme configuré.</p>
    } @else {
      <app-data-table
        [columns]="columns"
        [rows]="$any(terms())"
        [cellTemplates]="{ kind: kindCell, active: activeCell }"
        [rowActions]="actions"
        actionsLabel=""
        [pageSize]="15"
        searchPlaceholder="Rechercher un terme…"
        [rowClass]="rowClassFn"
      />
      <ng-template #kindCell let-t>
        <span class="badge" [class.banned]="t.kind === 'BANNED'" [class.spam]="t.kind === 'SPAM'">{{ t.kind === 'BANNED' ? 'Interdit' : 'Spam' }}</span>
      </ng-template>
      <ng-template #activeCell let-t>
        <input type="checkbox" [checked]="t.isActive" (change)="toggle($any(t))" />
      </ng-template>
      <ng-template #actions let-t>
        <button class="btn btn-sm" (click)="remove($any(t))">Supprimer</button>
      </ng-template>
    }
  `,
})
export class ModerationTermsComponent implements OnInit {
  private readonly api = inject(ModerationApi);

  readonly terms = signal<ModerationTerm[]>([]);
  readonly message = signal('');
  term = '';
  kind: 'BANNED' | 'SPAM' = 'BANNED';

  readonly columns: DataColumn[] = [
    { key: 'term', label: 'Terme', sortable: true, value: (r) => String(r['term'] ?? '') },
    {
      key: 'kind',
      label: 'Nature',
      sortable: true,
      value: (r) => (r['kind'] === 'BANNED' ? 'Interdit' : 'Spam'),
      cellTemplate: 'kind',
    },
    {
      key: 'isActive',
      label: 'Actif',
      sortable: true,
      value: (r) => (r['isActive'] ? 'Actif' : 'Inactif'),
      cellTemplate: 'active',
    },
  ];

  readonly rowClassFn = (row: Record<string, unknown>): Record<string, boolean> => ({
    off: !row['isActive'],
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.listTerms().subscribe({ next: (list) => this.terms.set(list) });
  }

  add(): void {
    this.api.createTerm({ term: this.term.trim(), kind: this.kind }).subscribe({
      next: () => {
        this.term = '';
        this.message.set('✅ Terme ajouté.');
        this.reload();
      },
      error: (err) => this.message.set(err?.error?.message ?? "Ajout impossible (doublon ?)."),
    });
  }

  toggle(t: ModerationTerm): void {
    this.api.updateTerm(t.id, { isActive: !t.isActive }).subscribe({ next: () => this.reload() });
  }

  remove(t: ModerationTerm): void {
    this.api.deleteTerm(t.id).subscribe({ next: () => this.reload() });
  }
}

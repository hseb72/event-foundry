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
  templateUrl: './moderation-terms.component.html',
  styleUrl: './moderation-terms.component.css',
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

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FollowApi } from '../../core/api/follow.service';
import { ReferenceDataApi } from '../../core/api/reference-data.service';
import { Follow, FollowTargetType } from '../../core/models';

const TYPE_LABELS: Record<FollowTargetType, string> = {
  ORGANIZATION: 'Organisations',
  ORGANIZER: 'Organisateurs',
  VENUE: 'Lieux',
  ACTIVITY: 'Activités',
  SUBJECT: 'Sujets',
  EVENT_SERIES: "Séries d'événements",
};

interface FollowGroup {
  type: FollowTargetType;
  label: string;
  items: Follow[];
}

/** « Mes suivis » (Follow — FSPEC.06 / UISPEC.06 FOL-02) : liste groupée par type, avec retrait. */
@Component({
  selector: 'app-follows',
  standalone: true,
  styles: [
    `
      .group {
        margin-bottom: 1.5rem;
      }
      .group h2 {
        font-size: 1rem;
        margin: 0 0 0.6rem;
      }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.55rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: 10px;
        margin-bottom: 0.4rem;
        border-left: 4px solid var(--exp);
      }
      .name {
        font-weight: 600;
      }
      .row-actions {
        display: flex;
        gap: 0.4rem;
        flex-shrink: 0;
      }
      .empty {
        color: var(--muted);
        padding: 2rem 0;
      }
    `,
  ],
  template: `
    <h1>Mes suivis</h1>
    <p class="muted">Organisateurs, lieux, activités et catégories que vous suivez.</p>

    @if (groups().length === 0) {
      <p class="empty">Vous ne suivez encore rien. Suivez une catégorie depuis « Découvrir ».</p>
    } @else {
      @for (group of groups(); track group.type) {
        <section class="group">
          <h2>{{ group.label }}</h2>
          @for (item of group.items; track item.id) {
            <div class="row">
              <span class="name">{{ name(item) }}</span>
              <span class="row-actions">
                <button
                  class="btn"
                  [title]="item.notify ? 'Couper les notifications' : 'Activer les notifications'"
                  (click)="toggleNotify(item)"
                >
                  {{ item.notify ? '🔔 Notifs' : '🔕 Muet' }}
                </button>
                <button class="btn" (click)="unfollow(item)">Ne plus suivre</button>
              </span>
            </div>
          }
        </section>
      }
    }
  `,
})
export class FollowsComponent implements OnInit {
  private readonly followApi = inject(FollowApi);
  private readonly referenceData = inject(ReferenceDataApi);

  private readonly names = signal<Map<string, string>>(new Map());

  readonly groups = computed<FollowGroup[]>(() => {
    const byType = new Map<FollowTargetType, Follow[]>();
    for (const follow of this.followApi.follows()) {
      byType.set(follow.targetType, [...(byType.get(follow.targetType) ?? []), follow]);
    }
    return [...byType.entries()]
      .map(([type, items]) => ({ type, label: TYPE_LABELS[type], items }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  ngOnInit(): void {
    this.followApi.reload().subscribe();
    // Résolution des libellés à partir des référentiels (id → nom).
    this.referenceData.subjects().subscribe((items) => this.mergeNames(items));
    this.referenceData.activities().subscribe((items) => this.mergeNames(items));
    this.referenceData.organizers().subscribe((items) => this.mergeNames(items));
    this.referenceData.venues().subscribe((items) => this.mergeNames(items));
  }

  name(follow: Follow): string {
    return this.names().get(follow.targetId) ?? follow.targetId;
  }

  unfollow(follow: Follow): void {
    this.followApi.unfollow(follow.targetType, follow.targetId);
  }

  toggleNotify(follow: Follow): void {
    this.followApi.setNotify(follow.targetType, follow.targetId, !follow.notify);
  }

  private mergeNames(items: { id: string; name: string }[]): void {
    this.names.update((map) => {
      const next = new Map(map);
      for (const item of items) {
        next.set(item.id, item.name);
      }
      return next;
    });
  }
}

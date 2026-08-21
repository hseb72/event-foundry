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
  templateUrl: './follows.component.html',
  styleUrl: './follows.component.css',
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

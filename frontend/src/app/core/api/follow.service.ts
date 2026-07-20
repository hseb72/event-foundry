import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE } from '../api.config';
import { Follow, FollowTargetType } from '../models';

/** Clé d'unicité d'un suivi (type + cible). */
function key(targetType: FollowTargetType, targetId: string): string {
  return `${targetType}:${targetId}`;
}

/**
 * Client + magasin des suivis (Follow — ADR.19 / FSPEC.06). Charge une fois la liste des suivis
 * de l'utilisateur dans un signal partagé ; les boutons « Suivre » lisent/mutent cet état.
 */
@Injectable({ providedIn: 'root' })
export class FollowApi {
  private readonly http = inject(HttpClient);

  /** Suivis actifs de l'utilisateur. */
  readonly follows = signal<Follow[]>([]);
  private readonly keys = computed(() => new Set(this.follows().map((f) => key(f.targetType, f.targetId))));
  private loaded = false;

  /** Charge les suivis une seule fois (idempotent). */
  ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.reload().subscribe();
  }

  reload(): Observable<Follow[]> {
    return this.http
      .get<Follow[]>(`${API_BASE}/me/follows`)
      .pipe(tap((follows) => this.follows.set(follows)));
  }

  isFollowing(targetType: FollowTargetType, targetId: string): boolean {
    return this.keys().has(key(targetType, targetId));
  }

  follow(targetType: FollowTargetType, targetId: string): void {
    this.http
      .post<Follow>(`${API_BASE}/follows`, { targetType, targetId })
      .subscribe((created) => {
        if (!this.isFollowing(targetType, targetId)) {
          this.follows.update((list) => [created, ...list]);
        }
      });
  }

  unfollow(targetType: FollowTargetType, targetId: string): void {
    this.http.delete<void>(`${API_BASE}/follows/${targetType}/${targetId}`).subscribe(() => {
      this.follows.update((list) => list.filter((f) => !(f.targetType === targetType && f.targetId === targetId)));
    });
  }

  toggle(targetType: FollowTargetType, targetId: string): void {
    if (this.isFollowing(targetType, targetId)) {
      this.unfollow(targetType, targetId);
    } else {
      this.follow(targetType, targetId);
    }
  }

  /** Active/coupe les notifications d'un suivi (RG-FOL-04). */
  setNotify(targetType: FollowTargetType, targetId: string, notify: boolean): void {
    this.http
      .patch<Follow>(`${API_BASE}/follows/${targetType}/${targetId}`, { notify })
      .subscribe((updated) => {
        this.follows.update((list) =>
          list.map((f) =>
            f.targetType === targetType && f.targetId === targetId ? { ...f, notify: updated.notify } : f,
          ),
        );
      });
  }
}

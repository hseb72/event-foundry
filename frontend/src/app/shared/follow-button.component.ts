import { Component, Input, OnInit, inject } from '@angular/core';
import { FollowApi } from '../core/api/follow.service';
import { FollowTargetType } from '../core/models';

/**
 * Bouton « Suivre / Suivi » (Follow — FSPEC.06 / UISPEC.06). Lit l'état partagé du magasin de
 * suivis et bascule au clic (idempotent côté serveur). N'utilise que des tokens de design (ADR.22).
 */
@Component({
  selector: 'app-follow-button',
  standalone: true,
  styles: [
    `
      button {
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--muted);
        border-radius: 999px;
        padding: 0.2rem 0.65rem;
        font-size: 0.78rem;
        font-weight: 700;
        transition: all 0.15s ease;
      }
      button:hover {
        border-color: var(--exp);
      }
      button.on {
        background: var(--exp);
        border-color: var(--exp);
        color: var(--exp-contrast);
      }
    `,
  ],
  template: `
    <button type="button" [class.on]="following()" (click)="toggle($event)">
      {{ following() ? '★ Suivi' : '☆ Suivre' }}
    </button>
  `,
})
export class FollowButtonComponent implements OnInit {
  @Input({ required: true }) targetType!: FollowTargetType;
  @Input({ required: true }) targetId!: string;

  private readonly followApi = inject(FollowApi);

  ngOnInit(): void {
    this.followApi.ensureLoaded();
  }

  following(): boolean {
    return this.followApi.isFollowing(this.targetType, this.targetId);
  }

  toggle(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.followApi.toggle(this.targetType, this.targetId);
  }
}

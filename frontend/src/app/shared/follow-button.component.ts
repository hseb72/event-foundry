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
  templateUrl: './follow-button.component.html',
  styleUrl: './follow-button.component.css',
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

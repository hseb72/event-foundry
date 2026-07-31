import { Component, OnInit } from '@angular/core';
import { RecommendationApi } from '../../core/api/recommendation.service';
import { Recommendation, RecommendationAction } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card.component';

/**
 * Recommandations personnelles (EPIC 06). Chaque proposition affiche ses justifications
 * (explicabilité — ADR.09) et permet un retour (accepter / ignorer / refuser). Le mode
 * « Surprends-moi » élargit volontairement les propositions vers la nouveauté.
 */
@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [EventCardComponent],
  styles: [
    `
      .head {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
      }
      .toggle {
        display: inline-flex;
        gap: 0;
        border: 1px solid var(--border);
        border-radius: 999px;
        overflow: hidden;
      }
      .toggle button {
        border: 0;
        background: var(--surface);
        padding: 0.4rem 0.9rem;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--muted);
      }
      .toggle button.on {
        background: var(--exp);
        color: #fff;
      }
      .reco {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.9rem 1rem;
        margin-bottom: 0.9rem;
      }
      .reasons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin: 0.6rem 0;
      }
      .reason {
        background: rgba(124, 58, 237, 0.1);
        color: var(--exp);
        border-radius: 999px;
        padding: 0.15rem 0.6rem;
        font-size: 0.78rem;
        font-weight: 600;
      }
      .score {
        font-size: 0.78rem;
        color: var(--muted);
        font-weight: 700;
      }
      .actions {
        display: flex;
        gap: 0.4rem;
        margin-top: 0.5rem;
      }
      .btn-sm {
        padding: 0.3rem 0.7rem;
        font-size: 0.82rem;
      }
      .empty {
        color: var(--muted);
        padding: 2rem 0;
      }
    `,
  ],
  template: `
    <div class="head">
      <div>
        <h1>Pour vous</h1>
        <p class="muted" style="margin:0">Des suggestions déterministes et expliquées, jamais imposées.</p>
      </div>
      <div class="toggle" role="tablist" aria-label="Mode de recommandation">
        <button [class.on]="!surprise" (click)="setSurprise(false)">Mes affinités</button>
        <button [class.on]="surprise" (click)="setSurprise(true)">🎲 Surprends-moi</button>
      </div>
    </div>

    @if (loading) {
      <p class="muted">Calcul des recommandations…</p>
    } @else if (recommendations.length === 0) {
      <p class="empty">
        Aucune recommandation pour l'instant. Ajoutez des événements à votre planning pour
        affiner vos suggestions, ou activez « Surprends-moi ».
      </p>
    } @else {
      @for (reco of recommendations; track reco.event.id) {
        <div class="reco">
          <app-event-card [event]="reco.event" />
          <div class="reasons">
            <span class="score">Pertinence {{ reco.score }}</span>
            @for (reason of reco.reasons; track reason) {
              <span class="reason">{{ reason }}</span>
            }
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-primary" (click)="act(reco, 'ACCEPTED')">Ça m'intéresse</button>
            <button class="btn btn-sm" (click)="act(reco, 'IGNORED')">Plus tard</button>
            <button class="btn btn-sm" (click)="act(reco, 'REJECTED')">Non merci</button>
          </div>
        </div>
      }
    }
  `,
})
export class RecommendationsComponent implements OnInit {
  recommendations: Recommendation[] = [];
  surprise = false;
  loading = true;

  constructor(private readonly recommendationApi: RecommendationApi) {}

  ngOnInit(): void {
    this.load();
  }

  setSurprise(value: boolean): void {
    if (this.surprise === value) {
      return;
    }
    this.surprise = value;
    this.load();
  }

  /** Enregistre le retour et retire la recommandation de la liste (elle n'est plus reproposée). */
  act(reco: Recommendation, action: RecommendationAction): void {
    this.recommendations = this.recommendations.filter((r) => r.event.id !== reco.event.id);
    this.recommendationApi.feedback(reco.event.id, action).subscribe({
      error: () => this.load(),
    });
  }

  private load(): void {
    this.loading = true;
    this.recommendationApi.list(this.surprise, 12).subscribe({
      next: (recos) => {
        this.recommendations = recos;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}

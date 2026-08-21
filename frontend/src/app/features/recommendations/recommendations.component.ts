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
  templateUrl: './recommendations.component.html',
  styleUrl: './recommendations.component.css',
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

import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PublicApi } from '../../core/api/public.service';
import { AuthService } from '../../core/auth/auth.service';
import { EventDto } from '../../core/models';

/**
 * Page de garde publique (accessible sans compte). Présente des événements « à la Une » sans aucun
 * contexte utilisateur, avec deux appels à l'action : se connecter ou créer un compte. La
 * localisation est **opt-in** : tant que le visiteur ne l'autorise pas, la sélection est nationale ;
 * s'il l'accepte, on repriorise par proximité. Un visiteur déjà connecté est renvoyé vers l'app.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, DatePipe],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--bg, #14101c);
        color: var(--fg, #f4f2f8);
      }
      .hero {
        background: linear-gradient(135deg, #2a1b3d, #db2777);
        padding: 3rem 1.5rem 2.5rem;
        text-align: center;
      }
      .hero h1 {
        font-size: 2.2rem;
        font-weight: 800;
        margin: 0 0 0.5rem;
      }
      .hero p {
        opacity: 0.9;
        max-width: 560px;
        margin: 0 auto 1.5rem;
      }
      .cta {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        flex-wrap: wrap;
      }
      .section {
        max-width: 1080px;
        margin: 0 auto;
        padding: 2rem 1.5rem 3rem;
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .head h2 {
        margin: 0;
        font-size: 1.3rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
      }
      .evt {
        display: grid;
        gap: 0.35rem;
        padding: 1rem;
        border-radius: 12px;
        background: var(--card, #211a2e);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .evt .title {
        font-weight: 700;
      }
      .evt .meta {
        font-size: 0.82rem;
        opacity: 0.8;
      }
      .chip {
        display: inline-block;
        font-size: 0.72rem;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        background: rgba(219, 39, 119, 0.25);
        width: fit-content;
      }
      .muted {
        opacity: 0.75;
        font-size: 0.85rem;
      }
      .loc-btn {
        font-size: 0.82rem;
      }
    `,
  ],
  template: `
    <header class="hero">
      <h1>EventFoundry</h1>
      <p>
        Tous les tournois et rendez-vous de vos jeux de cartes préférés, au même endroit. Explorez
        les événements à la Une, puis créez votre compte pour composer votre calendrier.
      </p>
      <div class="cta">
        <a class="btn btn-primary" routerLink="/register">Créer un compte</a>
        <a class="btn" routerLink="/login">Se connecter</a>
      </div>
    </header>

    <section class="section">
      <div class="head">
        <h2>À la Une</h2>
        @if (!located()) {
          <button class="btn loc-btn" (click)="useLocation()" [disabled]="locating()">
            {{ locating() ? 'Localisation…' : '📍 Autour de moi' }}
          </button>
        } @else {
          <span class="muted">📍 Trié selon votre position</span>
        }
      </div>

      @if (loading()) {
        <p class="muted">Chargement…</p>
      } @else if (events().length === 0) {
        <p class="muted">Aucun événement à la Une pour le moment. Revenez bientôt !</p>
      } @else {
        <div class="grid">
          @for (e of events(); track e.id) {
            <article class="evt">
              <span class="chip">{{ e.activity }}</span>
              <span class="title">{{ e.title }}</span>
              <span class="meta">{{ e.startsAt | date: 'EEEE d MMMM, HH:mm' }}</span>
              @if (e.venue || e.city) {
                <span class="meta">{{ e.venue }}{{ e.venue && e.city ? ' · ' : '' }}{{ e.city }}</span>
              }
            </article>
          }
        </div>
        <p class="muted" style="margin-top:1.5rem">
          Connectez-vous pour indiquer votre intérêt, réserver et suivre vos organisateurs.
        </p>
      }
    </section>
  `,
})
export class LandingComponent implements OnInit {
  readonly events = signal<EventDto[]>([]);
  readonly loading = signal(true);
  readonly locating = signal(false);
  readonly located = signal(false);

  constructor(
    private readonly api: PublicApi,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // Un visiteur déjà connecté n'a pas besoin de la vitrine : direction l'application.
    if (this.auth.isAuthenticated()) {
      void this.router.navigate(['/home']);
      return;
    }
    this.load();
  }

  private load(coords?: { latitude: number; longitude: number }): void {
    this.loading.set(true);
    this.api.featured(8, coords).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Géolocalisation opt-in : demandée uniquement sur action explicite du visiteur. */
  useLocation(): void {
    if (!navigator.geolocation) {
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.locating.set(false);
        this.located.set(true);
        this.load({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      // Refus ou échec : on reste sur la sélection nationale, sans insister.
      () => this.locating.set(false),
      { timeout: 8000 },
    );
  }
}

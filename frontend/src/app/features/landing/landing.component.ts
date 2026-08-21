import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PublicApi } from '../../core/api/public.service';
import { AuthService } from '../../core/auth/auth.service';
import { EventDto } from '../../core/models';
import { LogoComponent } from '../../shared/logo.component';
import { eventCoverBackground } from '../../shared/event-cover';

/**
 * Page de garde publique (accessible sans compte) — vitrine festive (UISPEC.13). Barre de navigation
 * avec logo et accès Se connecter / S'inscrire, hero deux colonnes au titre en dégradé de marque,
 * événements « à la Une » en cartes illustrées, présentation des fonctionnalités, bande d'appel à
 * l'action et pied de page. La localisation reste **opt-in** : sélection nationale par défaut,
 * repriorisée par proximité uniquement si le visiteur l'autorise. Un visiteur déjà connecté est
 * renvoyé vers l'application.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, DatePipe, LogoComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit {
  readonly events = signal<EventDto[]>([]);
  readonly loading = signal(true);
  readonly locating = signal(false);
  readonly located = signal(false);
  readonly year = new Date().getFullYear();

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

  /** Trois premiers événements pour le collage du hero. */
  showcase(): EventDto[] {
    return this.events().slice(0, 3);
  }

  /** Fond d'une carte : première image de l'événement si disponible, sinon dégradé festif déterministe. */
  cover(e: EventDto): string {
    return eventCoverBackground(e);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

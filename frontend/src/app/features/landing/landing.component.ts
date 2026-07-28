import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PublicApi } from '../../core/api/public.service';
import { AuthService } from '../../core/auth/auth.service';
import { EventDto } from '../../core/models';
import { LogoComponent } from '../../shared/logo.component';

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
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--bg);
        color: var(--text);
      }
      a { color: inherit; }

      /* --- Barre de navigation --- */
      .nav {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.85rem 1.5rem;
        background: color-mix(in srgb, var(--surface) 82%, transparent);
        backdrop-filter: saturate(1.2) blur(10px);
        border-bottom: 1px solid var(--border);
      }
      .nav-links {
        display: flex;
        gap: 1.6rem;
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--muted);
      }
      .nav-links a { cursor: pointer; }
      .nav-links a:hover { color: var(--text); }
      .nav-cta { display: flex; gap: 0.6rem; align-items: center; }

      /* --- Hero --- */
      .hero {
        position: relative;
        overflow: hidden;
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        gap: 2rem;
        align-items: center;
        padding: 3.5rem 1.5rem 3rem;
      }
      .blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        opacity: 0.5;
        z-index: 0;
        pointer-events: none;
      }
      .blob.b1 { width: 320px; height: 320px; background: radial-gradient(circle, #ec4899, transparent 70%); top: -80px; right: 8%; }
      .blob.b2 { width: 260px; height: 260px; background: radial-gradient(circle, #6366f1, transparent 70%); bottom: -60px; left: -40px; }
      .hero-copy { position: relative; z-index: 1; }
      .hero h1 {
        font-size: clamp(2.2rem, 4.5vw, 3.4rem);
        line-height: 1.05;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin: 0 0 1rem;
      }
      .hero h1 .g {
        background: var(--brand-gradient);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .hero .lead {
        color: var(--muted);
        font-size: 1.05rem;
        max-width: 30rem;
        margin: 0 0 1.6rem;
      }
      .hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.4rem; }
      .trust { display: flex; gap: 1.3rem; flex-wrap: wrap; color: var(--muted); font-size: 0.86rem; font-weight: 600; }
      .trust span { display: inline-flex; align-items: center; gap: 0.4rem; }
      .trust svg { color: var(--brand-3); }

      /* --- Collage visuel (hero droite) --- */
      .showcase { position: relative; z-index: 1; min-height: 360px; }
      .fcard {
        position: absolute;
        width: 76%;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .fcard .ph { height: 108px; background-size: cover; background-position: center; }
      .fcard .body { padding: 0.7rem 0.85rem; }
      .fcard .t { font-weight: 700; font-size: 0.92rem; }
      .fcard .m { color: var(--muted); font-size: 0.78rem; margin-top: 0.15rem; }
      .fcard.c1 { top: 0; right: 0; transform: rotate(3deg); }
      .fcard.c2 { top: 120px; left: 0; transform: rotate(-4deg); z-index: 2; }
      .fcard.c3 { bottom: 0; right: 6%; transform: rotate(2deg); }
      .showcase-empty {
        position: relative; z-index: 1; height: 100%; min-height: 300px; border-radius: 22px;
        background: var(--brand-gradient); box-shadow: var(--shadow-brand);
        display: grid; place-items: center; color: #fff;
      }

      /* --- Sections --- */
      .section { max-width: 1180px; margin: 0 auto; padding: 2.5rem 1.5rem; }
      .section.alt { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); max-width: none; }
      .section.alt > .inner { max-width: 1180px; margin: 0 auto; }
      .head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.4rem; flex-wrap: wrap; }
      .head h2 { margin: 0; font-size: 1.5rem; }
      .eyebrow { text-align: center; color: var(--brand-3); font-weight: 800; letter-spacing: 0.08em; font-size: 0.78rem; text-transform: uppercase; }
      .section-title { text-align: center; font-size: clamp(1.5rem, 3vw, 2rem); margin: 0.3rem 0 2rem; }

      /* --- Cartes d'événement --- */
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.2rem; }
      .evt {
        display: flex; flex-direction: column; border-radius: var(--radius); overflow: hidden;
        background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-sm);
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .evt:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
      .evt .cover { height: 150px; background-size: cover; background-position: center; position: relative; }
      .evt .cover .chip {
        position: absolute; top: 0.6rem; left: 0.6rem; font-size: 0.72rem; font-weight: 700; color: #fff;
        padding: 0.15rem 0.6rem; border-radius: 999px; background: rgba(0, 0, 0, 0.42); backdrop-filter: blur(4px);
      }
      .evt .body { padding: 0.8rem 0.9rem 1rem; display: grid; gap: 0.3rem; }
      .evt .title { font-weight: 700; }
      .evt .meta { font-size: 0.82rem; color: var(--muted); }

      /* --- Fonctionnalités --- */
      .features { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.4rem; }
      .feat { text-align: left; }
      .feat .ic { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; margin-bottom: 0.8rem; }
      .feat h3 { margin: 0 0 0.35rem; font-size: 1.02rem; }
      .feat p { margin: 0; color: var(--muted); font-size: 0.9rem; line-height: 1.5; }

      /* --- Bande CTA --- */
      .cta-band {
        max-width: 1180px; margin: 1rem auto 3rem; border-radius: var(--radius-lg);
        background: var(--brand-gradient-soft); border: 1px solid var(--border);
        padding: 2rem 2.2rem; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap;
      }
      .cta-band h2 { margin: 0 0 0.35rem; font-size: 1.5rem; }
      .cta-band p { margin: 0; color: var(--muted); max-width: 34rem; }
      .cta-band .actions { display: flex; gap: 0.7rem; flex-wrap: wrap; }

      /* --- Footer --- */
      footer { border-top: 1px solid var(--border); background: var(--surface); }
      .foot { max-width: 1180px; margin: 0 auto; padding: 2.5rem 1.5rem 1.5rem; display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 2rem; }
      .foot .about { color: var(--muted); font-size: 0.9rem; max-width: 20rem; margin: 0.8rem 0; }
      .foot .social { display: flex; gap: 0.8rem; color: var(--muted); }
      .foot .col h4 { font-size: 0.9rem; margin: 0 0 0.7rem; }
      .foot .col a { display: block; color: var(--muted); font-size: 0.88rem; padding: 0.22rem 0; cursor: pointer; }
      .foot .col a:hover { color: var(--text); }
      .foot-bottom { border-top: 1px solid var(--border); padding: 1rem 1.5rem; text-align: center; color: var(--muted); font-size: 0.82rem; }

      .muted { color: var(--muted); }
      .loc-btn { font-size: 0.85rem; }

      @media (max-width: 900px) {
        .hero { grid-template-columns: 1fr; }
        .showcase { display: none; }
        .features { grid-template-columns: repeat(2, 1fr); }
        .foot { grid-template-columns: 1fr 1fr; }
        .nav-links { display: none; }
      }
      @media (max-width: 560px) {
        .features { grid-template-columns: 1fr; }
      }
    `,
  ],
  template: `
    <!-- Navigation -->
    <nav class="nav">
      <app-logo [size]="30" />
      <div class="nav-links">
        <a (click)="scrollTo('featured')">Explorer</a>
        <a (click)="scrollTo('features')">Fonctionnalités</a>
        <a routerLink="/register">Publier un événement</a>
      </div>
      <div class="nav-cta">
        <a class="btn" routerLink="/login">Se connecter</a>
        <a class="btn btn-brand" routerLink="/register">S'inscrire</a>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <span class="blob b1"></span>
      <span class="blob b2"></span>

      <div class="hero-copy">
        <h1>Découvrez. Planifiez.<br /><span class="g">Vivez des moments inoubliables.</span></h1>
        <p class="lead">
          EventFoundry vous connecte aux meilleurs événements culturels, artistiques et de loisirs près
          de chez vous. Organisez votre planning ou partagez vos propres événements.
        </p>
        <div class="hero-actions">
          <a class="btn btn-brand btn-lg" (click)="scrollTo('featured')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            Explorer les événements
          </a>
          <a class="btn btn-lg" routerLink="/register">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Publier un événement
          </a>
        </div>
        <div class="trust">
          <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg> Événements vérifiés</span>
          <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /></svg> Gratuit pour tous</span>
          <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3" /><path d="M15 11a3 3 0 1 0-2-5.2M3 20a6 6 0 0 1 12 0M14.5 14a6 6 0 0 1 6.5 6" /></svg> Communauté engagée</span>
        </div>
      </div>

      <!-- Collage : aperçu d'événements réels à la Une -->
      @if (!loading() && events().length >= 1) {
        <div class="showcase">
          @for (e of showcase(); track e.id; let i = $index) {
            <article class="fcard" [class.c1]="i === 0" [class.c2]="i === 1" [class.c3]="i === 2">
              <div class="ph" [style.background]="cover(e)"></div>
              <div class="body">
                <div class="t">{{ e.title }}</div>
                <div class="m">{{ e.startsAt | date: 'd MMM' }}{{ e.city ? ' · ' + e.city : '' }}</div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="showcase-empty"><app-logo [size]="72" [wordmark]="false" /></div>
      }
    </section>

    <!-- À la une -->
    <section class="section" id="featured">
      <div class="head">
        <h2>À la une</h2>
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
        <p class="muted">Aucun événement à la une pour le moment. Revenez bientôt !</p>
      } @else {
        <div class="grid">
          @for (e of events(); track e.id) {
            <article class="evt">
              <div class="cover" [style.background]="cover(e)">
                <span class="chip">{{ e.activity }}</span>
              </div>
              <div class="body">
                <span class="title">{{ e.title }}</span>
                <span class="meta">{{ e.startsAt | date: 'EEEE d MMMM, HH:mm' }}</span>
                @if (e.venue || e.city) {
                  <span class="meta">{{ e.venue }}{{ e.venue && e.city ? ' · ' : '' }}{{ e.city }}</span>
                }
              </div>
            </article>
          }
        </div>
        <p class="muted" style="margin-top:1.5rem">
          Connectez-vous pour indiquer votre intérêt, réserver et suivre vos organisateurs.
        </p>
      }
    </section>

    <!-- Fonctionnalités -->
    <section class="section alt" id="features">
      <div class="inner">
        <p class="eyebrow">Pour tous les passionnés</p>
        <h2 class="section-title">Tout ce dont vous avez besoin pour vivre et partager vos passions</h2>
        <div class="features">
          <div class="feat">
            <div class="ic" style="background:rgba(139,92,246,0.14);color:#8b5cf6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <h3>Trouvez facilement</h3>
            <p>Recherchez par lieu, date, catégorie ou mots-clés et trouvez l’événement qui vous correspond.</p>
          </div>
          <div class="feat">
            <div class="ic" style="background:rgba(236,72,153,0.14);color:#ec4899">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="17" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
            </div>
            <h3>Organisez votre planning</h3>
            <p>Ajoutez vos événements préférés à votre agenda personnel et recevez des rappels.</p>
          </div>
          <div class="feat">
            <div class="ic" style="background:rgba(249,115,22,0.16);color:#f97316">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <h3>Publiez vos événements</h3>
            <p>Créez et partagez vos propres événements en quelques minutes seulement.</p>
          </div>
          <div class="feat">
            <div class="ic" style="background:rgba(16,185,129,0.14);color:#10b981">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3" /><path d="M15 11a3 3 0 1 0-2-5.2M3 20a6 6 0 0 1 12 0M14.5 14a6 6 0 0 1 6.5 6" /></svg>
            </div>
            <h3>Rejoignez la communauté</h3>
            <p>Connectez-vous avec d’autres passionnés et ne manquez rien autour de vous.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Bande CTA -->
    <section class="cta-band">
      <div>
        <h2>Prêt à ne rien manquer ?</h2>
        <p>Inscrivez-vous gratuitement pour gérer votre planning et découvrir des événements qui vous ressemblent.</p>
      </div>
      <div class="actions">
        <a class="btn btn-brand btn-lg" routerLink="/register">Créer mon compte</a>
        <a class="btn btn-lg" routerLink="/login">Se connecter</a>
      </div>
    </section>

    <!-- Footer -->
    <footer>
      <div class="foot">
        <div>
          <app-logo [size]="30" />
          <p class="about">La plateforme qui connecte les gens aux événements qui comptent.</p>
        </div>
        <div class="col">
          <h4>Explorer</h4>
          <a (click)="scrollTo('featured')">Tous les événements</a>
          <a (click)="scrollTo('features')">Fonctionnalités</a>
          <a routerLink="/register">Aujourd'hui</a>
        </div>
        <div class="col">
          <h4>Mon compte</h4>
          <a routerLink="/login">Se connecter</a>
          <a routerLink="/register">Créer un compte</a>
        </div>
        <div class="col">
          <h4>À propos</h4>
          <a routerLink="/register">Publier un événement</a>
          <a routerLink="/login">Aide</a>
        </div>
      </div>
      <div class="foot-bottom">© {{ year }} EventFoundry. Tous droits réservés.</div>
    </footer>
  `,
})
export class LandingComponent implements OnInit {
  readonly events = signal<EventDto[]>([]);
  readonly loading = signal(true);
  readonly locating = signal(false);
  readonly located = signal(false);
  readonly year = new Date().getFullYear();

  /** Palette de placeholders festifs (dégradés de marque) pour les événements sans image. */
  private static readonly PLACEHOLDERS = [
    'linear-gradient(135deg, #f97316, #ec4899)',
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #6366f1, #06b6d4)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
  ];

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
    const image = e.media?.find((m) => m.contentType?.startsWith('image/'));
    if (image) {
      return `center / cover no-repeat url("${image.url}")`;
    }
    let hash = 0;
    for (const ch of e.id) hash = (hash + ch.charCodeAt(0)) | 0;
    const list = LandingComponent.PLACEHOLDERS;
    return list[Math.abs(hash) % list.length];
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

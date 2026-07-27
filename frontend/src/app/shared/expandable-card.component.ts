import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

/**
 * Carte extensible standardisée (UISPEC.14). État **compact** par défaut : hauteur fixe, contenu
 * tronqué avec un fondu, footer portant le bouton Développer ; état **développé** : hauteur
 * automatique, contenu intégral. L'état est purement local et n'est jamais persisté (§13) : au
 * rechargement, toutes les cartes reviennent en compact.
 *
 * Conforme UISPEC.14 : le bouton et le fondu ne s'affichent que si le contenu **dépasse** la
 * hauteur compacte (§7 — « les cartes courtes ne présentent aucun bouton »), détection automatique
 * via `ResizeObserver` ; libellé accessible explicite (§11) ; animation douce ~0.28s ease (§8) ;
 * tokens uniquement (§12 / UISPEC.13). Le contenu est projeté (`<ng-content>`), les liaisons de la
 * page hôte sont préservées.
 */
@Component({
  selector: 'app-expandable-card',
  standalone: true,
  styles: [
    `
      :host {
        display: block;
      }
      .xcard {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--border);
        border-radius: 12px;
        background: var(--surface);
        overflow: hidden;
      }
      .xhead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        padding: 0.9rem 1.1rem 0.4rem;
      }
      .xhead h2 {
        margin: 0;
        font-size: 1rem;
      }
      .xbody {
        position: relative;
        padding: 0 1.1rem 0.6rem;
        overflow: hidden;
        /* Animation douce du changement d'état (UISPEC.14 §8 : 250–350ms, ease). */
        transition: max-height 0.28s ease;
      }
      /* Fondu indiquant que du contenu est disponible sous la ligne de coupe (mode compact — §6). */
      .fade {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2.4rem;
        background: linear-gradient(to bottom, transparent, var(--surface));
        pointer-events: none;
      }
      .xfoot {
        border-top: 1px solid var(--border);
        padding: 0.4rem 1.1rem;
        display: flex;
        justify-content: flex-end;
      }
      .toggle {
        border: 0;
        background: transparent;
        color: var(--exp);
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 0.2rem 0.4rem;
      }
    `,
  ],
  template: `
    <section class="xcard">
      <header class="xhead">
        <h2>{{ cardTitle }}</h2>
        <ng-content select="[card-actions]"></ng-content>
      </header>
      <div
        #body
        class="xbody"
        [style.max-height]="expanded() || !overflowing() ? 'none' : compactHeight + 'px'"
      >
        <ng-content></ng-content>
        @if (!expanded() && overflowing()) {
          <div class="fade"></div>
        }
      </div>
      <!-- §7 : aucun bouton si le contenu tient déjà dans la hauteur compacte. -->
      @if (overflowing()) {
        <footer class="xfoot">
          <button
            type="button"
            class="toggle"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="(expanded() ? 'Réduire la carte ' : 'Développer la carte ') + cardTitle"
            (click)="toggle()"
          >
            {{ expanded() ? '▲ Réduire' : '▼ Développer' }}
          </button>
        </footer>
      }
    </section>
  `,
})
export class ExpandableCardComponent implements AfterViewInit, OnDestroy {
  /** Titre affiché dans l'entête de la carte. */
  @Input() cardTitle = '';
  /** Hauteur (px) du corps en mode compact. Le corps + l'entête + le footer donnent une carte
   *  repliée d'environ 240px. */
  @Input() compactHeight = 160;

  @ViewChild('body') private bodyRef?: ElementRef<HTMLDivElement>;

  readonly expanded = signal(false);
  /** Vrai si le contenu dépasse la hauteur compacte (sinon : ni bouton ni fondu — §7). */
  readonly overflowing = signal(false);

  private observer?: ResizeObserver;

  ngAfterViewInit(): void {
    const el = this.bodyRef?.nativeElement;
    if (!el) {
      return;
    }
    this.measure(el);
    // Le contenu projeté peut changer de hauteur (chargement asynchrone, saisie) : on recalcule.
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.measure(el));
      this.observer.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  toggle(): void {
    this.expanded.update((v) => !v);
  }

  /** Compare la hauteur réelle du contenu à la hauteur compacte (marge de 4px anti-oscillation). */
  private measure(el: HTMLElement): void {
    if (this.expanded()) {
      return; // en développé, la hauteur est libre : la mesure d'overflow n'a pas de sens.
    }
    this.overflowing.set(el.scrollHeight > this.compactHeight + 4);
  }
}

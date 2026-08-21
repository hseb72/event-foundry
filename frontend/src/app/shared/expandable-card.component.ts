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
  templateUrl: './expandable-card.component.html',
  styleUrl: './expandable-card.component.css',
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

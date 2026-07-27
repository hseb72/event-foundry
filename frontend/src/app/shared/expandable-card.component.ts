import { Component, Input, signal } from '@angular/core';

/**
 * Carte extensible standardisée (UISPEC.14). État **compact** par défaut : hauteur fixe, contenu
 * tronqué avec un fondu, footer toujours visible portant le bouton Développer ; état **développé** :
 * hauteur automatique, contenu intégral. L'état est purement local et ne modifie jamais les données.
 * Le contenu est projeté (`<ng-content>`), les liaisons de la page hôte sont préservées.
 */
@Component({
  selector: 'app-expandable-card',
  standalone: true,
  styles: [
    `
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
        transition: max-height 0.2s ease;
      }
      .xbody.compact {
        overflow: hidden;
      }
      /* Fondu indiquant que du contenu est disponible sous la ligne de coupe (mode compact). */
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
      <div class="xbody" [class.compact]="!expanded()" [style.max-height]="expanded() ? 'none' : compactHeight + 'px'">
        <ng-content></ng-content>
        @if (!expanded()) {
          <div class="fade"></div>
        }
      </div>
      <footer class="xfoot">
        <button type="button" class="toggle" [attr.aria-expanded]="expanded()" (click)="toggle()">
          {{ expanded() ? '▲ Réduire' : '▼ Développer' }}
        </button>
      </footer>
    </section>
  `,
})
export class ExpandableCardComponent {
  /** Titre affiché dans l'entête de la carte. */
  @Input() cardTitle = '';
  /** Hauteur (px) du corps en mode compact. */
  @Input() compactHeight = 210;

  readonly expanded = signal(false);

  toggle(): void {
    this.expanded.update((v) => !v);
  }
}

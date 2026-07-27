import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

/**
 * Zone de dépôt de fichier réutilisable : glisser-déposer, clic pour parcourir, ou coller
 * (Ctrl/Cmd+V) une image / un fichier depuis le presse-papiers. Émet le `File` retenu ;
 * la validation métier (taille, type précis) reste à la charge du composant parent / du backend.
 */
@Component({
  selector: 'app-file-drop',
  standalone: true,
  template: `
    <div
      class="dz"
      [class.over]="over()"
      role="button"
      tabindex="0"
      [attr.aria-label]="'Déposer, parcourir ou coller un fichier. ' + hint"
      (click)="picker.click()"
      (keydown.enter)="picker.click()"
      (keydown.space)="$event.preventDefault(); picker.click()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (paste)="onPaste($event)"
    >
      <input #picker type="file" [accept]="accept" hidden (change)="onInput($event)" />
      <p class="dz-lead">
        <strong>Glissez-déposez</strong> un fichier, <span class="dz-link">cliquez pour parcourir</span>,
        ou collez-le (Ctrl/Cmd+V)
      </p>
      @if (fileName()) {
        <p class="dz-file">📎 {{ fileName() }}</p>
      } @else if (hint) {
        <p class="muted dz-hint">{{ hint }}</p>
      }
    </div>
  `,
  styles: [
    `
      .dz {
        border: 2px dashed var(--border);
        border-radius: var(--radius);
        padding: 1.4rem;
        text-align: center;
        color: var(--muted);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .dz:hover,
      .dz:focus-visible {
        border-color: var(--exp);
        outline: none;
      }
      .dz.over {
        border-color: var(--exp);
        background: color-mix(in srgb, var(--exp) 8%, transparent);
        color: var(--text, inherit);
      }
      .dz-lead {
        margin: 0;
        font-size: 0.9rem;
      }
      .dz-link {
        color: var(--exp);
        text-decoration: underline;
      }
      .dz-file {
        margin: 0.5rem 0 0;
        font-weight: 600;
        color: var(--text, inherit);
        word-break: break-all;
      }
      .dz-hint {
        margin: 0.4rem 0 0;
        font-size: 0.8rem;
      }
    `,
  ],
})
export class FileDropComponent {
  /** Types acceptés (même syntaxe que l'attribut HTML `accept`, ex. `image/*,.pdf`). */
  @Input() accept = '';
  /** Indication affichée sous la zone (formats / taille). */
  @Input() hint = '';
  /** Fichier retenu (dépôt, sélection ou collage). */
  @Output() fileSelected = new EventEmitter<File>();

  readonly over = signal(false);
  readonly fileName = signal('');

  onInput(event: Event): void {
    this.take((event.target as HTMLInputElement).files?.[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.over.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.over.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.over.set(false);
    this.take(event.dataTransfer?.files?.[0]);
  }

  onPaste(event: ClipboardEvent): void {
    const file = event.clipboardData?.files?.[0];
    if (file) {
      event.preventDefault();
      this.take(file);
    }
  }

  /** Retient le fichier s'il correspond au filtre `accept` (best-effort, insensible à la casse). */
  private take(file: File | null | undefined): void {
    if (!file || !this.matchesAccept(file)) {
      return;
    }
    this.fileName.set(file.name);
    this.fileSelected.emit(file);
  }

  private matchesAccept(file: File): boolean {
    if (!this.accept.trim()) {
      return true;
    }
    const tokens = this.accept.split(',').map((token) => token.trim().toLowerCase());
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();
    return tokens.some((token) => {
      if (!token) {
        return false;
      }
      if (token.startsWith('.')) {
        return name.endsWith(token);
      }
      if (token.endsWith('/*')) {
        return type.startsWith(token.slice(0, -1)); // ex. "image/" pour "image/*"
      }
      return type === token;
    });
  }
}

import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

/**
 * Zone de dépôt de fichier réutilisable : glisser-déposer, clic pour parcourir, ou coller
 * (Ctrl/Cmd+V) une image / un fichier depuis le presse-papiers. Émet le `File` retenu ;
 * la validation métier (taille, type précis) reste à la charge du composant parent / du backend.
 */
@Component({
  selector: 'app-file-drop',
  standalone: true,
  templateUrl: './file-drop.component.html',
  styleUrl: './file-drop.component.css',
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

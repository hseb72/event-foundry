import { NotFoundException } from '@nestjs/common';

/** Import introuvable (HTTP 404). */
export class ImportJobNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Import introuvable : ${id}.`);
  }
}

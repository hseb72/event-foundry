import { PayloadTooLargeException } from '@nestjs/common';

/** Document trop volumineux au regard de la limite configurée (→ HTTP 413, TSPEC.07). */
export class FileTooLargeException extends PayloadTooLargeException {
  constructor(sizeBytes: number, maxBytes: number) {
    const mb = (max: number): string => (max / (1024 * 1024)).toFixed(1);
    super(`Document trop volumineux (${mb(sizeBytes)} Mo). Taille maximale : ${mb(maxBytes)} Mo.`);
  }
}

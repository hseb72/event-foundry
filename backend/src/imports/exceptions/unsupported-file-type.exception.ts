import { BadRequestException } from '@nestjs/common';

/** Format de fichier non supporté (validation → HTTP 400, TSPEC.07). */
export class UnsupportedFileTypeException extends BadRequestException {
  constructor(mimeType: string) {
    super(`Format non supporté : « ${mimeType} ». Formats acceptés : PNG, JPEG, PDF.`);
  }
}

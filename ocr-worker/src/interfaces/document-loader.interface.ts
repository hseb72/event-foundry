export const DOCUMENT_LOADER = 'DOCUMENT_LOADER';

export interface LoadedDocument {
  buffer: Buffer;
  contentType: string;
}

/** Charge le document original depuis le stockage objet. */
export interface DocumentLoader {
  load(attachmentId: string): Promise<LoadedDocument>;
}

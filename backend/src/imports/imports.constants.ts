/** Types MIME acceptés pour un import fichier (TSPEC.03 : PNG, JPG/JPEG, PDF). */
export const ALLOWED_UPLOAD_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf']);

/** Taille maximale par défaut d'un document importé (20 Mo). Plafond dur (interceptor Multer). */
export const DEFAULT_MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Plafond quotidien d'imports par défaut (0 = illimité). Configurable par l'Operator (OPE-005). */
export const DEFAULT_MAX_IMPORTS_PER_DAY = 0;

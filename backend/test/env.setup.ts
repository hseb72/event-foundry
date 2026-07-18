/**
 * Valeurs d'environnement pour les tests E2E. DATABASE_URL et REDIS_* sont fournis par la
 * commande (CI / infra locale) ; on ne pose ici que des valeurs par défaut inoffensives.
 */
process.env.JWT_SECRET ??= 'e2e-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'e2e-refresh-secret';
process.env.JWT_EXPIRES_IN ??= '3600s';
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d';
process.env.REDIS_HOST ??= '127.0.0.1';
process.env.REDIS_PORT ??= '6379';
// MinIO est remplacé par un stub dans les tests : ces valeurs ne servent qu'au démarrage.
process.env.MINIO_ENDPOINT ??= 'localhost';
process.env.MINIO_ROOT_USER ??= 'test';
process.env.MINIO_ROOT_PASSWORD ??= 'test';
process.env.MINIO_BUCKET ??= 'test-bucket';
process.env.CORS_ORIGIN ??= 'http://localhost:4200';

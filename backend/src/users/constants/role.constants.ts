/**
 * Rôles système (données initialisées par le seed). RBAC V1 : l'autorisation repose sur
 * les rôles (TSPEC.07). Une gestion granulaire des permissions relève de la V2.
 */
export const SystemRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type SystemRoleName = (typeof SystemRole)[keyof typeof SystemRole];

/** Utilisateur authentifié, attaché à la requête par le JwtAuthGuard. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
}

/** Charge utile signée dans le JWT d'accès. */
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

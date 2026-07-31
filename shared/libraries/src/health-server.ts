import { createServer, Server } from 'node:http';

export interface HealthServerOptions {
  port: number;
  component: string;
  /** Vérifie les dépendances critiques (ex. Redis). Absent ⇒ readiness = liveness. */
  readiness?: () => Promise<boolean>;
}

/**
 * Petit serveur HTTP de santé pour les Workers, qui n'exposent aucune API (TSPEC.07).
 * `GET /health` = liveness (le process répond) ; `GET /health/ready` = readiness (503 si une
 * dépendance est indisponible). N'expose rien d'autre : ce n'est pas une API publique.
 */
export function startHealthServer(options: HealthServerOptions): Server {
  const server = createServer((req, res) => {
    const url = req.url ?? '';
    if (req.method !== 'GET') {
      res.writeHead(405).end();
      return;
    }
    if (url === '/health') {
      json(res, 200, { status: 'ok', component: options.component });
      return;
    }
    if (url === '/health/ready') {
      const check = options.readiness ? options.readiness() : Promise.resolve(true);
      check
        .then((ready) =>
          json(res, ready ? 200 : 503, {
            status: ready ? 'ok' : 'degraded',
            component: options.component,
          }),
        )
        .catch(() => json(res, 503, { status: 'degraded', component: options.component }));
      return;
    }
    res.writeHead(404).end();
  });
  server.listen(options.port);
  return server;
}

function json(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

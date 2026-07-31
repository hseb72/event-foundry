# k8s

Manifests / Helm charts de déploiement Kubernetes (EPIC 15).

Pods applicatifs : `frontend`, `backend`, `ocr-worker`, `classifier-worker`.
Services : PostgreSQL, Redis, MinIO.

Tous les pods applicatifs sont stateless et répliquables horizontalement (ARCHI.01).
Les secrets sont injectés par Kubernetes, jamais versionnés (TSPEC.07).

# HoneyTrace Visualizer API

Backend Express + TypeScript para almacenar y servir los análisis finales producidos por el Engine Rust. El frontend React consumirá esta API; no se ejecutan ataques ni correlación aquí.

## Flujo

```text
Engine Rust local/Raspberry -> POST /api/v1/analyses/ingest -> PostgreSQL
                                                        -> React: lista, detalle y grafo
                                                        -> historial de visualización
```

La ingestión es saliente desde la Raspberry/PC. Railway no intenta acceder al `localhost` del dispositivo. Para desarrollo puede usarse un túnel sobre un relay separado, nunca sobre el puerto del honeypot.

## Persistencia

La migración [`db/001_initial.sql`](db/001_initial.sql) crea:

- `app_user`, `user_session`: identidad GitHub y sesiones revocables.
- `analysis`: resumen, `AttackTrace` original, confianza, etapas y técnicas.
- `analysis_event`: eventos necesarios para timeline y grafo.
- `visualization_history`: aperturas, filtros y exportaciones del panel.

Se usan UUID, claves foráneas, índices, `CHECK` de confianza, deduplicación por `(source_id, trace_id)` y consultas parametrizadas. La base no guarda secretos ni payloads completos salvo los campos que el contrato del Engine entregue explícitamente.

## API

- `GET /health`
- `POST /api/v1/analyses/ingest` — Bearer `INGEST_TOKEN`; acepta `AttackTrace` + eventos.
- `GET /api/v1/analyses?limit=&offset=` — historial resumido.
- `GET /api/v1/analyses/:id` — detalle y eventos.
- `GET /api/v1/analyses/:id/graph` — nodos para visualización.
- `POST /api/v1/visualization-history` — requiere sesión de usuario.
- `GET /api/auth/github/redirect`, `GET /api/auth/github/callback`, `POST /api/auth/logout`.

## Desarrollo

```powershell
Copy-Item .env.example .env
npm ci
npm run build
npm test
docker compose up -d --build
npm run db:migrate
```

Los tests usan `MemoryRepository`, por lo que no dependen de Railway ni de PostgreSQL. La prueba E2E valida ingestión, grafo, historial y cierre de sesión.

## Railway

Crear un servicio desde el repositorio, configurar `DATABASE_URL` con PostgreSQL de Railway y definir `INGEST_TOKEN`, `OAUTH_STATE_SECRET`, `GITHUB_*` y `FRONTEND_URL` como secretos. Registrar el callback de GitHub con la URL pública de Railway:

```text
https://<servicio>.up.railway.app/api/auth/github/callback
```

Ejecutar la migración como tarea de despliegue antes de aceptar ingestiones. Nunca publicar `DATABASE_URL`, el secreto OAuth ni el token de ingestión en el frontend.

# HoneyTrace Visualizer API

Backend Express + TypeScript + Prisma ORM para almacenar y servir de forma privada los análisis finales producidos por el Engine Rust. Cada análisis pertenece a una cuenta GitHub; el frontend React no ejecuta ataques ni correlación.

## Flujo

```text
Engine Rust local/Raspberry -> token de dispositivo de la cuenta -> POST /api/v1/analyses/ingest -> PostgreSQL
                                                        -> React: lista, detalle y grafo
                                                        -> historial de visualización
```

La ingestión es saliente desde la Raspberry/PC. Railway no intenta acceder al `localhost` del dispositivo. Para desarrollo puede usarse un túnel sobre un relay separado, nunca sobre el puerto del honeypot.

## Persistencia

El modelo [`prisma/schema.prisma`](prisma/schema.prisma) y sus migraciones crean:

- `app_user`, `user_session`: identidad GitHub y sesiones rotables con access/refresh tokens en cookies `HttpOnly`.
- `ingest_token`: credenciales revocables de Raspberry/Engine vinculadas a una cuenta.
- `analysis`: resumen, `AttackTrace` original, confianza, etapas y técnicas.
- `analysis_event`: eventos necesarios para timeline y grafo.
- `visualization_history`: aperturas, filtros y exportaciones del panel.

Se usan UUID, claves foráneas, índices, `CHECK` de confianza, deduplicación por `(user_id, source_id, trace_id)` y consultas parametrizadas generadas por Prisma. La base guarda el evento normalizado completo entregado por el Engine, pero nunca los tokens en texto plano.

## API

- `GET /health`
- `POST /api/v1/analyses/ingest` — Bearer de dispositivo asociado a la cuenta; acepta `AttackTrace` + `NormalizedEvent[]`.
- `GET /api/v1/me` — cuenta autenticada.
- `GET /api/v1/stats` — estadísticas globales de la cuenta.
- `GET /api/v1/analyses` — paginación y filtros por fuente, etapa, técnica, confianza, fecha y búsqueda.
- `GET /api/v1/analyses/:id` — detalle y eventos.
- `GET /api/v1/analyses/:id/graph` — nodos y aristas causales/secuenciales.
- `GET /api/v1/analyses/:id/export?format=json|ndjson` — exportación formal.
- `POST /api/v1/visualization-history` — requiere sesión de usuario.
- `GET|POST|DELETE /api/v1/ingest-tokens` — administrar credenciales de dispositivos.
- `GET /api/auth/github/redirect`, `GET /api/auth/github/callback`, `POST /api/auth/refresh`, `POST /api/auth/logout`.

Salvo ingestión y autenticación, todo `/api/v1` requiere la cookie de sesión. Un identificador de análisis de otra cuenta responde `404` para no revelar su existencia.

## Desarrollo

```powershell
Copy-Item .env.example .env
npm ci
npm run prisma:generate
npm run build
npm test
docker compose up -d --build
npm run db:migrate
```

Las pruebas unitarias y de integración usan `MemoryRepository`. El E2E real vive en `tests/e2e` de la raíz y recorre HTTP + Express + Prisma + PostgreSQL. Requiere una base dedicada cuyo nombre contenga `e2e`:

```powershell
docker compose --profile test up -d postgres-e2e
$env:VISUALIZER_E2E_DATABASE_URL="postgresql://visualizer:visualizer-e2e-only@localhost:5434/honeytrace_visualizer_e2e"
$env:DATABASE_URL=$env:VISUALIZER_E2E_DATABASE_URL
npm run db:migrate
npm run test:e2e
```

Comandos separados: `npm run test:unit`, `npm run test:integration` y `npm run test:coverage`. Sin `VISUALIZER_E2E_DATABASE_URL`, la suite E2E se marca como omitida y nunca intenta usar la base normal.

## Railway

Crear un servicio desde el repositorio, configurar `DATABASE_URL` con PostgreSQL de Railway y definir `OAUTH_STATE_SECRET`, `GITHUB_*`, `FRONTEND_URL` y `COOKIE_SECURE=true`. Usar `COOKIE_SAME_SITE=none` sólo si frontend y API están en sitios diferentes; la API valida `Origin` en operaciones mutables. Registrar el callback de GitHub con la URL pública de Railway:

```text
https://<servicio>.up.railway.app/api/auth/github/callback
```

Ejecutar `prisma migrate deploy` antes de aceptar ingestiones. El usuario crea el token de su dispositivo una vez autenticado; el valor sólo se devuelve al crearlo. Nunca publicar `DATABASE_URL`, el secreto OAuth ni un token de ingestión en el frontend.

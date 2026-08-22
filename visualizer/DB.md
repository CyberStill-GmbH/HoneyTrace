# Base de datos del Visualizer

## Modelo

`analysis` es la unidad histórica y tiene una restricción única por fuente y `trace_id`; repetir una ingestión actualiza la misma ejecución en vez de duplicarla. `analysis_event` conserva los eventos ordenados por `sequence` para timeline y grafo. `visualization_history` registra la interacción del usuario sin guardar contenido sensible.

## Seguridad

- PostgreSQL no se expone públicamente en Docker; sólo el API necesita la URL.
- El repositorio usa placeholders `$1`, `$2`, etc.; no concatena valores en SQL.
- Eliminación en cascada evita eventos huérfanos.
- Las sesiones almacenan SHA-256 del token, no el token plano.
- `state` OAuth usa HMAC, nonce, expiración de 10 minutos y cookie `HttpOnly`/`SameSite=Lax`.
- El `INGEST_TOKEN` es independiente de las sesiones humanas.

## Migraciones y respaldo

```powershell
npm run db:migrate
pg_dump "$env:DATABASE_URL" --format=custom --file=visualizer-backup.dump
```

En Railway se debe activar respaldo de PostgreSQL, limitar el rol de aplicación y ejecutar migraciones versionadas durante el despliegue. Los datos de investigación deben conservar el commit del Engine, el `source_id` y los hashes de los artefactos.

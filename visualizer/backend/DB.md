# Base de datos del Visualizer

## Modelo

Prisma define el modelo canónico en `prisma/schema.prisma`. `analysis` pertenece a un usuario y tiene una restricción única por cuenta, fuente y `trace_id`; repetir una ingestión actualiza la misma ejecución en vez de duplicarla. `analysis_event.event_data` conserva el `NormalizedEvent` completo para timeline y causalidad. `visualization_history` sólo admite análisis de la misma cuenta.

## Seguridad

- PostgreSQL no se expone públicamente en Docker; sólo el API necesita la URL.
- El repositorio usa placeholders `$1`, `$2`, etc.; no concatena valores en SQL.
- Eliminación en cascada evita eventos huérfanos.
- Las sesiones y tokens de ingestión almacenan SHA-256, no credenciales planas.
- Access y refresh tokens se rotan y se entregan en cookies `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- `state` OAuth usa HMAC, nonce, expiración de 10 minutos y cookie `HttpOnly`/`SameSite=Lax`.
- Cada token de ingestión identifica a su cuenta propietaria, se muestra una sola vez y puede revocarse sin cerrar sesiones humanas.

## Migraciones y respaldo

```powershell
npm run prisma:generate
npm run db:migrate
pg_dump "$env:DATABASE_URL" --format=custom --file=visualizer-backup.dump
```

En Railway se debe activar respaldo de PostgreSQL, limitar el rol de aplicación y ejecutar `prisma migrate deploy` durante el despliegue. La migración Prisma incluida crea el nuevo esquema privado; una base antigua con análisis sin propietario requiere asignación manual de propietario antes de adoptarla. Los datos de investigación deben conservar el commit del Engine, el `source_id` y los hashes de los artefactos.

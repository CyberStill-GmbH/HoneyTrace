# API del honeypot

Estas rutas son deliberadamente vulnerables y solo deben recibir ataques reales dentro del laboratorio aislado y autorizado. Los registros, usuarios, órdenes, productos y archivos deben ser de laboratorio; nunca se deben introducir datos reales.

- `POST /auth`: simula Brute Force; cada intento genera `AUTH_FAILURE` o `AUTH_SUCCESS`.
- `GET /users/{user_id}`: simula IDOR; `X-User-ID` identifica al actor y no bloquea el acceso al objeto señuelo.
- `GET /products?q=...`: ejecuta una consulta SQL interpolada deliberadamente vulnerable, aislada a `products`; el payload `' OR 1=1 --` devuelve filas señuelo y genera `SQLI_ATTEMPT`.
- `GET /files?path=...`: simula Path Traversal únicamente dentro de `decoy_data/`; fuera del root devuelve `403`.
- `POST /orders/{order_id}/notes`: almacena `Note` sintético y genera `STORED_XSS_PAYLOAD`.
- `GET /orders/{order_id}/notes/render`: muestra la nota sin escapar dentro de la vista señuelo para reproducir Stored XSS.
- `GET /health`: healthcheck sin datos de usuario.
- `GET /health/observability`: contadores acotados de eventos emitidos y de seguridad; no devuelve payloads.

## Contrato de respuesta

Los endpoints devuelven JSON salvo `/files` (texto) y `/orders/.../render` (HTML señuelo). Cada respuesta incluye `X-Trace-ID`; los eventos se emiten como NDJSON por stdout y opcionalmente en `events.ndjson`.

No exponer estas rutas a redes institucionales ni reutilizar este comportamiento en una aplicación real.

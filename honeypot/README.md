# HoneyTrace Honeypot Backend

Este backend expone APIs deliberadamente vulnerables con fines de observación, demostración y pruebas de seguridad en entornos controlados.

> [!WARNING]
> No despliegues este servicio en producción ni lo expongas a Internet sin aislamiento y monitoreo adecuados. Las vulnerabilidades descritas a continuación son intencionales.

## Estado de implementación

- [x] Contenedor de PostgreSQL saludable.
- [x] Migración inicial y esquema relacional.
- [x] Aplicación FastAPI y `/health`.
- [x] Rutas vulnerables y sus pruebas unitarias, de integración y E2E.
- [x] Registro estructurado NDJSON y correlación por `trace_id`/`sequence`.

## APIs y vulnerabilidades intencionales implementadas

| API | Vulnerabilidad intencional | Descripción |
| --- | --- | --- |
| `/auth` | Brute Force | Acepta intentos reales de laboratorio y registra cada fallo/éxito. |
| `/users` | IDOR | Permite leer un usuario por ID sin autorización (datos señuelo). |
| `/products` | SQL Injection (SQLi) | Detecta patrones SQLi y devuelve filas señuelo, sin tocar SQL administrativo. |
| `/files` | Path Traversal | Resuelve rutas dentro del filesystem señuelo y registra escapes bloqueados. |
| `/orders` | Stored XSS mediante `Note` | Persiste `Note` y lo renderiza sin escape en la vista señuelo. |

Estas APIs deben utilizarse exclusivamente en laboratorios y ambientes autorizados.

## Validación

```powershell
docker compose up -d --build
docker compose exec -T backend alembic check
Invoke-RestMethod http://localhost:8000/health
# CLI de ataques HTTP reales (solo contra este honeypot aislado)
docker run --rm -v ${PWD}/scripts/honeytrace-cli:/src -w /src golang:1.22 \
  go run . --base-url http://host.docker.internal:8000 --confirm-lab --scenario all
```

# Observabilidad y contrato de eventos

## Objetivo

Capturar la evidencia mínima necesaria para reconstruir una interacción sin llenar la Raspberry Pi de 2 GB ni almacenar secretos o payloads completos. El honeypot emite eventos estructurados; el collector valida y normaliza; el motor posterior correlaciona por `trace_id` y contexto temporal.

## Formato de entrega

La salida es **NDJSON UTF-8**, un objeto JSON por línea. La fuente primaria es stdout del contenedor, compatible con Docker logs. Si `HONEYTRACE_LOG_DIR` está configurado, se escribe también `events.ndjson` con rotación.

Ejemplo mínimo:

```json
{"schema_version":"1.1","event_id":"uuid","timestamp":"2026-08-21T10:00:00.123Z","ingest_timestamp":"2026-08-21T10:00:00.130Z","trace_id":"hex","sequence":7,"event_type":"HTTP_REQUEST","raw_source":"honeypot-api","method":"GET","path":"/products","status_code":200,"duration_ms":4.21,"source_ip":"192.0.2.10","user_agent":"lab-client","vulnerability":"SQLi","outcome":"injected_query_executed","payload_sha256":"sha256","payload_size":12,"metadata":{"parameter":"q"}}
```

## Campos necesarios

- `schema_version`: versión del contrato; actualmente `1.1`.
- `event_id`: identificador único del evento.
- `timestamp`: UTC ISO-8601 con milisegundos.
- `ingest_timestamp`: instante UTC en que el collector recibe el evento.
- `trace_id`: correlaciona todas las solicitudes de una interacción.
- `sequence`: orden monotónico de emisión/ingestión; permite conservar temporalidad bajo concurrencia.
- `event_type`: enum operativo, por ejemplo `HTTP_REQUEST`, `AUTH_FAILURE`, `IDOR_ACCESS`, `SQLI_ATTEMPT`, `PATH_TRAVERSAL_ATTEMPT`, `STORED_XSS_PAYLOAD`.
- `raw_source`: origen (`honeypot-api`, `collector`, `system`).
- `method`, `path`, `status_code`, `duration_ms`: contexto HTTP cuando exista.
- `source_ip`, `user_agent`, `session_id`: solo si están autorizados; aplicar seudonimización antes de exportar.
- `vulnerability`, `outcome`: clasificación y resultado observado.
- `payload_sha256`, `payload_size`: evidencia de entrada sin conservar el payload completo.
- `metadata`: campos específicos acotados y sin secretos; no debe contener credenciales, cookies o archivos completos.
- `entities`, `causes`: entidades y relaciones de procedencia opcionales; el Engine los usa para construir un grafo causal acotado.

## Eventos por vulnerabilidad

- **Brute Force:** `AUTH_FAILURE`, `AUTH_SUCCESS`; metadata: usuario sintético, contador de intento y resultado.
- **IDOR:** `IDOR_ACCESS`, `IDOR_MISS`; metadata: actor y objeto objetivo, ambos identificadores sintéticos.
- **SQLi:** `SQLI_ATTEMPT`; metadata: parámetro, patrón detectado y filas señuelo devueltas.
- **Path Traversal:** `PATH_TRAVERSAL_ATTEMPT`, `PATH_TRAVERSAL_ACCESS`; metadata: root señuelo y resultado (`blocked`/`decoy`).
- **Stored XSS mediante Note:** `STORED_XSS_PAYLOAD`, `STORED_XSS_RENDER`; metadata: orden, nota y renderizador señuelo.

## Reglas de minimización

- Truncar strings a 256 caracteres, metadata a 32 claves y listas a 20 elementos.
- Nunca escribir passwords, tokens, cookies, headers de autorización ni cuerpos completos.
- Guardar hash SHA-256 y tamaño del payload cuando se necesite demostrar repetición.
- Usar `source_ip` seudonimizada en datasets de investigación.
- Separar logs de aplicación, acceso y seguridad si el volumen lo exige; para el MVP se unifican en NDJSON con `event_type`.

## Estrategia para Raspberry Pi 2 GB

- Logging a stdout y recolección por Docker; archivo opcional en SSD externo.
- Rotación de 5 MiB por archivo y 2 respaldos como valores iniciales (`HONEYTRACE_LOG_MAX_BYTES`, `HONEYTRACE_LOG_BACKUPS`).
- Buffer en memoria limitado a 2048 eventos para pruebas; el buffer no es almacenamiento durable.
- Procesamiento streaming por lotes pequeños; el collector rechaza líneas inválidas y limita cada lote.
- No ejecutar Wazuh manager, frontend ni servicios pesados en la Raspberry si reducen el margen de memoria.
- Medir CPU, RAM, temperatura, disco, latencia y eventos rechazados durante el ensayo.
- Retención inicial propuesta: 30 días; borrar o exportar con hash después de la ventana autorizada.

## Flujo de entrega

```text
FastAPI middleware + evento de seguridad
        ↓ NDJSON stdout / SSD rotado
Event Collector: leer NDJSON → limitar lote → aislar líneas inválidas
        ↓ objetos JSON
Normalizer: validar → normalizar → rechazar inválidos
        ↓ NormalizedEvent
Correlation Engine Rust (responsabilidad LT): agrupar por trace_id, sesión y ventana temporal
        ↓ AttackTrace + evidencia
Dataset de investigación / comparación Wazuh
```

El collector no ejecuta entradas, no interpreta contenido como código y no debe bloquear el endpoint por una caída del almacenamiento; debe contar el rechazo y continuar con un límite seguro.

El endpoint operativo `GET /health/observability` devuelve únicamente contadores acotados (`emitted`, `security`) y la capacidad del buffer. No sustituye al análisis de eventos ni expone payloads.

La fuente `postgresql` emite `DB_QUERY` con duración, operación, tabla, tamaño y hash de la sentencia; nunca almacena SQL literal ni parámetros. Los errores emiten `DB_ERROR`. `SYSTEM_METRIC` se obtiene al consultar `/health/observability` y contiene CPU, memoria y disco para scrapers de Wazuh/Engine.

La configuración paralela de Wazuh está en `wazuh/honeytrace-localfile.xml`; Wazuh y el Collector deben leer el mismo `events.ndjson` en modo solo lectura.

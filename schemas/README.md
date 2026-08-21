# Contratos para el Engine

El collector entrega **un `NormalizedEvent` por línea NDJSON**. El Engine debe consumir solo eventos validados contra [normalized_event.schema.json](normalized_event.schema.json). Al correlacionar, debe producir un `AttackTrace` conforme a [attack_trace.schema.json](attack_trace.schema.json).

## Entrada mínima del Engine

```json
{"schema_version":"1.1","event_id":"evt-1","timestamp":"2026-08-21T10:00:00.123Z","ingest_timestamp":"2026-08-21T10:00:00.130Z","trace_id":"abc123","sequence":7,"event_type":"SQLI_ATTEMPT","raw_source":"honeypot-api","path":"/products","status_code":200,"vulnerability":"SQLi","outcome":"all_decoy_rows_returned","payload_sha256":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef","payload_size":11,"entities":[{"id":"endpoint:/products","kind":"endpoint","role":"target"}],"causes":["evt-6"],"metadata":{"parameter":"q","row_count":3}}
```

## Salida esperada del Engine

```json
{"trace_id":"abc123","started_at":"2026-08-21T10:00:00.000Z","ended_at":"2026-08-21T10:00:01.000Z","stages":["recon","input-testing","exploitation"],"event_ids":["evt-1","evt-6"],"techniques":["T1190"],"confidence":0.91,"evidence":[{"event_id":"evt-1","reason":"SQLi pattern and decoy rows returned"}]}
```

`sequence` conserva el orden de ingestión; `causes` permite expresar relaciones de procedencia sin que el Engine tenga que inferirlas solo desde texto. El Engine debe rechazar eventos con esquema inválido, conservar `event_id` y `trace_id`, y reportar los rechazos por separado.

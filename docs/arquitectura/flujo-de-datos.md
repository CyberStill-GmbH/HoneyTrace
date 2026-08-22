# Flujo de datos

## Flujo principal (MVP)

```
1. Atacante interactúa con el Web Honeypot (HTTP requests)
2. El Honeypot emite telemetría NDJSON estructurada y eventos de aplicación/DB
3. El Event Collector captura la telemetría cruda (RawEvent)
4. El Collector envía el RawEvent al Normalizer
5. El Normalizer transforma el RawEvent en un NormalizedEvent (esquema común, ver /schemas)
6. El Correlation Engine consume NormalizedEvents y agrupa los relacionados (mismo IP/sesión/ventana temporal/etc.)
7. El módulo de Attack Reconstruction procesa el grupo correlacionado y produce un AttackTrace
8. El AttackTrace se exporta como JSON/NDJSON; la persistencia investigativa versionada queda pendiente.
```

## Flujo extendido (con SIEM, API y frontend)

```
3'. En paralelo al Collector, la telemetría también se envía a Wazuh
8. Una futura API de resultados podrá exponer el `AttackTrace` (los endpoints aún no están implementados).
9. Un futuro frontend podrá consumir esa API y renderizar dashboard + Attack Explorer.
```

## Ejemplo de transformación (Normalizer)

Entrada de una fuente:
```json
{ "ip": "10.0.0.17", "status": 401 }
```

Entrada de otra fuente para el mismo evento lógico:
```json
{ "source_address": "10.0.0.17", "event": "AUTH_FAILURE" }
```

Salida normalizada esperada (ejemplo conceptual, ver `/schemas` para el contrato formal):
```json
{
  "event_id": "uuid",
  "timestamp": "2026-08-18T10:00:00Z",
  "source_ip": "10.0.0.17",
  "event_type": "AUTH_FAILURE",
  "raw_source": "http-middleware",
  "session_id": null,
  "metadata": { "status": 401 }
}
```

## Ejemplo de correlación → reconstrucción

```
GET /auth
   │
   ▼
POST /auth
   │
   ▼
Authentication failure
   │
   ▼
POST /auth
   │
   ▼
Authentication failure
   │
   ▼
...
   │
   ▼
Correlation Engine agrupa la secuencia → mismo Attack #
   │
   ▼
Attack Reconstruction clasifica etapas:
   Recon → Login probing → Brute force → Authentication success → Admin access
   │
   ▼
AttackTrace #0042
```

## Volumetría y límites conocidos

- Hardware objetivo: Raspberry Pi 4 (2GB RAM). El diseño del Collector y Normalizer debe evitar acumulación de eventos en memoria; preferir procesamiento por streaming/lotes pequeños.
- Ver `RNF-01` en `docs/requisitos/requisitos.md` y los resultados de latencia en `research/results/` una vez existan.

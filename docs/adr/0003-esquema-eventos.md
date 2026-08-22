# 0003. Esquema común de eventos normalizados

Fecha: 2026-08-18
Estado: Aceptado; versión vigente 1.1

## Contexto

La telemetría proviene de fuentes heterogéneas (HTTP, aplicación, base de datos, sistema), cada una con su propio formato. El Correlation Engine y el módulo de Attack Reconstruction necesitan trabajar sobre un modelo común y estable para poder correlacionar eventos de distinto origen.

## Decisión

Se define un esquema común `NormalizedEvent`, versionado en `/schemas`, actualmente versión `1.1`, con campos de identidad, temporalidad, contexto HTTP y procedencia causal:

```json
{
  "event_id": "uuid",
  "timestamp": "ISO-8601",
  "source_ip": "string | null",
  "session_id": "string | null",
  "event_type": "string (enum controlado, p. ej. AUTH_FAILURE, HTTP_REQUEST, DB_QUERY, ...)",
  "endpoint": "string | null",
  "user_agent": "string | null",
  "trace_id": "string | null",
  "sequence": "integer >= 0",
  "ingest_timestamp": "ISO-8601 UTC",
  "raw_source": "string (collector/fuente de origen)",
  "entities": "array acotado de entidades",
  "causes": "array acotado de event_id causales",
  "metadata": "object (campos específicos de la fuente, sin normalizar)"
}
```

Todo `RawEvent` capturado por el Collector debe pasar por el Normalizer antes de llegar al Correlation Engine; el Correlation Engine y Attack Reconstruction **solo** consumen `NormalizedEvent`.

## Alternativas consideradas

- **Sin esquema común, correlación ad-hoc por fuente**: más rápido al inicio, pero acopla el Correlation Engine a los formatos específicos de cada fuente y dificulta añadir nuevas fuentes de telemetría.
- **Adoptar un estándar externo existente (p. ej. OCSF, CEF)** en lugar de un esquema propio: reduce el trabajo de diseño y facilita interoperabilidad, pero puede añadir complejidad no necesaria para el alcance de un MVP de un mes. Se deja como posible evolución futura (ADR nuevo si se adopta).

## Consecuencias

- Cualquier cambio al esquema de `NormalizedEvent` debe versionarse en `/schemas` y reflejarse en este ADR (o en uno nuevo si es un cambio mayor).
- El Normalizer se convierte en el único punto de entrada de "verdad" del pipeline; su cobertura de tests es crítica (ver `docs/testing/estrategia-de-pruebas.md`).
- Las fixtures sintéticas de `tests/fixtures/` deben expresarse ya en formato `NormalizedEvent` (o incluir ambos: crudo + esperado normalizado) para poder testear el Engine de forma aislada.

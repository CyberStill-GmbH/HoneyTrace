# Collector y Normalizer

Son dos componentes separados aunque vivan en el mismo paquete:

- `event_collector.py`: ingesta NDJSON, límites de lote y aislamiento de líneas inválidas.
- `normalizer/normalizer.py`: validación y transformación de un objeto ya parseado al contrato `NormalizedEvent` 1.1.

El Collector llama al Normalizer; ninguno implementa correlación ni reconstrucción.

Para validar un archivo o stream:

```powershell
Get-Content .\events.ndjson | python -m collector.cli --max-events 1000
```

El proceso devuelve código `1` si hubo líneas rechazadas y las reporta por stderr; los eventos válidos continúan por stdout.

El contrato detallado está en [docs/arquitectura/observabilidad.md](../docs/arquitectura/observabilidad.md). Las pruebas unitarias viven en `collector/tests/`.

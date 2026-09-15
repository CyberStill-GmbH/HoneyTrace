# Pipeline de análisis

Esta carpeta reúne la cadena que transforma telemetría en una reconstrucción causal, separada del honeypot que origina los eventos y del visualizador que consulta los resultados.

```text
collector → normalizer → engine
```

- [Collector](collector/README.md): ingesta NDJSON, límites y aislamiento de registros inválidos.
- [Normalizer](normalizer/README.md): validación y transformación al contrato `NormalizedEvent`.
- [Engine](engine/README.md): correlación, grafo de procedencia, reconstrucción, scoring y publicación de trazas.

La agrupación es estructural, no un acoplamiento: cada componente conserva código, pruebas, contratos y responsabilidad propios.

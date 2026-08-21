# Normalizer

Componente independiente del Event Collector. Recibe un objeto JSON ya parseado y entrega un `NormalizedEvent` 1.1 validado para el Engine Rust.

El Normalizer no lee sockets, archivos ni stdin, no ejecuta payloads y no agrupa eventos. Sus pruebas están en `normalizer/tests/`.

# Architecture Decision Records (ADR)

Este directorio contiene las decisiones de arquitectura relevantes del proyecto HoneyTrace.

## ¿Cuándo escribir un ADR?

Cuando se toma una decisión que:

- Afecta el stack tecnológico (lenguaje, framework, base de datos, etc.).
- Afecta el contrato entre componentes (p. ej. el esquema de eventos).
- Es difícil o costosa de revertir.
- Genera desacuerdo o dudas dentro del equipo y vale la pena dejar registrado el razonamiento.

No es necesario un ADR para decisiones triviales o fácilmente reversibles.

## Formato

Cada ADR sigue la plantilla:

```
# NNNN. Título

Fecha: YYYY-MM-DD
Estado: Propuesto | Aceptado | Rechazado | Reemplazado por NNNN

## Contexto
## Decisión
## Alternativas consideradas
## Consecuencias
```

## Índice

| ID | Título | Estado |
|----|--------|--------|
| [0001](0001-estructura-general.md) | Estructura general del proyecto y stack por componente | Aceptado para MVP |
| [0002](0002-siem.md) | Elección de Wazuh como SIEM de comparación | Aceptado opcional |
| [0003](0003-esquema-eventos.md) | Esquema común de eventos normalizados | Aceptado 1.1 |
| [adr_001](adr_001_python_db_stack.md) | Stack PostgreSQL/SQLAlchemy/Alembic | Aceptado (legado) |

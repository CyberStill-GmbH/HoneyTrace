# Sprint 0 — Fundacional y línea base

## Duración

17–19 de agosto de 2026.

## Objetivo

Dejar una base reproducible, acordar la arquitectura y registrar honestamente qué existe antes de implementar el MVP investigativo.

## Backlog verificado

- [x] Crear la estructura base (`honeypot/`, `collector/`, `normalizer/`, `engine/`, `schemas/`, `tests/` y `scripts/`). `api/`, `frontend/` y `research/` permanecen como extensiones planificadas.
- [x] Redactar planteamiento, objetivos y preguntas de investigación.
- [x] Redactar el primer borrador de requisitos.
- [x] Redactar y revisar ADR 0001–0003; sus estados vigentes están en `docs/adr/README.md`.
- [x] Redactar el threat model inicial.
- [x] Crear workflows `ci.yml` y `security.yml`, con validación de Python, Rust y Go.
- [x] Definir Definition of Ready y Definition of Done.
- [x] Preparar Docker Compose local con FastAPI, PostgreSQL 16 y healthcheck.
- [x] Crear modelos SQLAlchemy y migración inicial de seis tablas.
- [x] Verificar `alembic check`, restricciones de PostgreSQL y `/health`.
- [ ] Validar desde una clonación limpia por una segunda persona.
- [ ] Registrar nombres reales de responsables para LT, IA e IB.

## Evidencia disponible

- `docker compose ps`: backend operativo y PostgreSQL `healthy`.
- `alembic check`: sin nuevas operaciones de actualización.
- Revisión de esquema: tablas `users`, `products`, `files`, `orders`, `notes` y `order_items`.
- `GET /health`: `{"status":"ok"}`.

## Criterio de salida

La base técnica está disponible. El Sprint 0 se considera **cerrado con deuda explícita**: validación independiente y asignación nominal continúan pendientes; las extensiones API/frontend/research no bloquean el MVP investigativo.

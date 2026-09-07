# HoneyTrace

Plataforma académica de investigación para desplegar un honeypot controlado, capturar telemetría de ataques y analizar técnicas observadas sin exponer activos institucionales.

## Estado verificado al 21 de agosto de 2026

- [x] PostgreSQL 16 en Docker Compose con healthcheck.
- [x] Modelos SQLAlchemy y migración inicial de Alembic.
- [x] Tablas `users`, `products`, `files`, `orders`, `notes` y `order_items` verificadas.
- [x] Backend FastAPI ejecutándose y endpoint `/health` operativo.
- [x] APIs vulnerables `/auth`, `/users`, `/products`, `/files` y `/orders` con ataques HTTP reales de laboratorio.
- [x] Captura, normalización y emisión NDJSON de eventos de seguridad.
- [x] Núcleo determinista inicial del Engine Rust: correlación, procedencia, reconstrucción por reglas y scoring.
- [x] Pruebas unitarias, integración, E2E del honeypot y contratos físicos en CI; carga y aceptación física final siguen pendientes.
- [x] API privada de resultados con Prisma, OAuth GitHub, estadísticas, filtros, grafo causal y exportación JSON/NDJSON.
- [x] Panel frontend local en React, Vite y Tailwind con dashboard, historial, dispositivos y Attack Explorer 3D.
- [ ] Despliegue en Raspberry Pi y prueba de campo en OTI UNI.

Que un archivo o modelo exista no significa que su funcionalidad esté terminada. Los elementos se marcan con `[x]` únicamente cuando existe evidencia reproducible.

## Documentación del proyecto

- [Índice general de documentación](docs/README.md): punto de entrada y rutas de lectura según el perfil.
- [Roadmap Scrum](docs/scrum_roadmap.md): sprints, responsables, criterios de aceptación y carga de trabajo.
- [Plan de investigación](docs/research_plan.md): objetivos, preguntas, datos, métricas y entregables académicos.
- [Plan de prueba OTI UNI](docs/oti_uni_test_plan.md): hardware, seguridad, ejecución y criterios de salida.
- [Arquitectura de base de datos](honeypot/db_documentation.md).
- [ADR del stack de persistencia](docs/adr/adr_001_python_db_stack.md).
- [Política de seguridad](SECURITY.md).
- [CLI de laboratorio](scripts/honeytrace-cli/README.md): herramienta Go para ataques reales controlados contra el honeypot autorizado.

## Hito de campo

Se propone realizar la prueba controlada en OTI UNI el **10 de septiembre de 2026, de 09:00 a 13:00 (America/Lima)**. La fecha y el horario deben ser confirmados por OTI UNI; no se desplegará el equipo sin autorización, alcance de red y responsable institucional definidos.

## Arranque local

```powershell
cd C:\projects\HoneyTrace\honeypot
docker compose up -d --build
docker compose ps
```

El backend queda disponible en `http://localhost:8000/health`. Este proyecto contiene vulnerabilidades deliberadas y solo debe ejecutarse en redes aisladas y autorizadas.

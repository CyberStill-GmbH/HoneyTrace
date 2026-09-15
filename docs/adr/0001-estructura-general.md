# 0001. Estructura general del proyecto y stack por componente

Fecha: 2026-08-18
Estado: Aceptado para el MVP; API y Frontend planificados

## Contexto

HoneyTrace debía entregarse en aproximadamente un mes para UNITEC 2026. El equipo tenía niveles de experiencia distintos y un integrante trabajaría remoto, sin acceso directo a la Raspberry Pi. Se necesitaba una estructura de componentes clara, con un stack por defecto que permitiera empezar a trabajar de inmediato, dejando explícito que no era una decisión definitiva.

## Decisión

Se adopta la estructura de componentes descrita en `docs/arquitectura/arquitectura.md` (Web Honeypot, Observabilidad, Collector, Normalizer, Correlation Engine, Attack Reconstruction, SIEM, API, Frontend), con el siguiente stack de partida:

| Componente | Tecnología |
|------------|------------|
| Honeypot | Python + FastAPI |
| DB honeypot | PostgreSQL |
| Instrumentación | Logging estructurado NDJSON y hooks propios |
| Collector | Python |
| Engine (Correlation + Reconstruction) | Rust |
| SIEM | Wazuh |
| API | Planificada; sin implementación en el MVP actual |
| Frontend | Planificado; sin implementación en el MVP actual |
| Contenedores | Docker |
| CI/CD | GitHub Actions |

Se prioriza el desarrollo del **MVP** (Honeypot → Telemetría → Collector → Normalizer → Correlation Engine → Attack Reconstruction) sobre las capas de integración y demostración (Wazuh, API, Frontend), que se consideran extensiones.

## Alternativas consideradas

- **Un único lenguaje para todo el stack** (p. ej. todo en Python o todo en TypeScript): simplifica el onboarding, pero Rust ofrece mejor rendimiento y garantías de seguridad de memoria para el componente más crítico en rendimiento y correctitud (el Engine).
- **Motor de correlación en Python**: más rápido de prototipar, pero con mayor riesgo de cuellos de botella en hardware limitado (Raspberry Pi 4, 2GB RAM) al procesar cientos/miles de eventos.

## Consecuencias

- El equipo necesita cubrir Rust para el componente más importante; se recomienda que quien tenga más experiencia o mayor disponibilidad lidere el Engine, y que el Collector (Python) sea el punto de entrada para integrantes con menos experiencia.
- Cualquier cambio de stack por componente debe registrarse como un nuevo ADR que referencie y actualice este documento.
- Este stack **no se considera inamovible**; debe quedar respaldado por requisitos concretos, no solo por preferencia.

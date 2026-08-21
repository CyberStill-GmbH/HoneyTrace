# Requisitos

## Leyenda de prioridad (MoSCoW)

- **M**ust — imprescindible para el MVP
- **S**hould — deseable, no bloquea el MVP
- **C**ould — extensión si hay tiempo
- **W**on't (esta iteración)

## Requisitos funcionales

| ID | Descripción | Prioridad | Componente |
|----|-------------|-----------|------------|
| RF-01 | El sistema debe exponer `/auth` (Brute Force), `/users` (IDOR), `/products` (SQLi), `/files` (Path Traversal) y `/orders` (Stored XSS mediante `Note`), usando únicamente datos sintéticos y superficies contenidas | M | Web Honeypot |
| RF-02 | El sistema debe registrar telemetría HTTP (request, response, endpoint, status, IP, User-Agent) | M | Observabilidad |
| RF-03 | El sistema debe registrar telemetría de aplicación (login, errores, acciones, excepciones) | M | Observabilidad |
| RF-04 | El sistema debe registrar telemetría de base de datos (consultas, errores, actividad anómala) | S | Observabilidad |
| RF-05 | El sistema debe registrar telemetría de sistema (conexiones, procesos, recursos) | C | Observabilidad |
| RF-06 | El Collector debe capturar, parsear y enviar eventos crudos desde las fuentes de telemetría | M | Collector |
| RF-07 | El Normalizer debe convertir eventos crudos heterogéneos a un `NormalizedEvent` según el esquema en `/schemas` | M | Normalizer |
| RF-08 | El Correlation Engine debe agrupar eventos normalizados relacionados por IP, sesión, ventana temporal, endpoint y tipo de evento | M | Engine |
| RF-09 | El módulo de Attack Reconstruction debe producir un `AttackTrace` con etapas, evidencias, timestamps, clasificación y confidence score | M | Engine |
| RF-10 | El sistema debe enviar telemetría en paralelo a Wazuh para comparación | S | SIEM |
| RF-11 | La API debe exponer `GET /attacks`, `GET /attacks/:id`, `GET /events`, `GET /stats`, `GET /attacks/:id/graph` | C | API |
| RF-12 | El frontend debe mostrar un dashboard con ataques detectados, actividad reciente y estadísticas | C | Frontend |
| RF-13 | El frontend debe ofrecer un Attack Explorer con timeline, evidencias y reconstrucción 3D | C | Frontend |
| RF-14 | El sistema debe permitir ejecutar ataques controlados y comparar la reconstrucción contra el ground truth | M | Investigación |

## Requisitos no funcionales

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| RNF-01 | El sistema debe poder ejecutarse en una Raspberry Pi 4 Model B (2GB RAM) con uso de recursos acotado | M |
| RNF-02 | El honeypot debe estar aislado de red de cualquier sistema de producción o dato real del equipo (ver threat-model.md) | M |
| RNF-03 | El motor de correlación/reconstrucción debe poder ejecutarse y probarse en un PC de desarrollo sin necesidad de la Raspberry, usando fixtures sintéticas | M |
| RNF-04 | El modelo de eventos (`NormalizedEvent`) debe estar versionado y documentado en `/schemas` | M |
| RNF-05 | Toda decisión de stack no trivial debe estar respaldada por un ADR | M |
| RNF-06 | El sistema debe tener cobertura de tests unitarios, de integración y (si el tiempo lo permite) e2e | S |
| RNF-07 | El despliegue debe estar contenedorizado (Docker) para reproducibilidad | S |
| RNF-08 | La API y el frontend no deben implementar lógica de correlación/reconstrucción; solo consumir resultados del Engine | S |
| RNF-09 | La prueba en OTI UNI requiere autorización escrita, red aislada, contacto institucional y procedimiento de retiro aprobado | M |
| RNF-10 | El despliegue debe usar el SSD SATA externo para datos y logs, montado por UUID y con rotación y límites definidos | M |

## Trazabilidad

Cada requisito Must debe estar vinculado a al menos una issue con label `tarea` y, cuando aplique, a una pregunta de investigación de `docs/investigacion/preguntas-de-investigacion.md`.

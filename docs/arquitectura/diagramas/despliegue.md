# Diagrama de despliegue

## Descripción

Vista física de dónde corre cada componente.

```
┌─────────────────────────────────────────────────────────┐
│                    Raspberry Pi 4 (2GB)                  │
│              + SSD SATA externo por adaptador USB        │
│                                                            │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Web Honeypot  │  │Event Collector│  │  Normalizer    │ │
│  │ (Docker,      │  │  (Docker)     │  │  (Docker)      │ │
│  │  red aislada) │  └──────────────┘  └────────────────┘ │
│  └───────────────┘                                       │
│                                                            │
│  ┌────────────────────┐   ┌───────────────────────────┐  │
│  │ Correlation Engine  │   │ Attack Reconstruction     │  │
│  │ (Docker, Rust)      │   │ (Docker, Rust)            │  │
│  └────────────────────┘   └───────────────────────────┘  │
│                                                            │
│  ┌───────────────┐                                       │
│  │ Wazuh agent    │──────────────► (Wazuh manager,       │
│  └───────────────┘                  local o en otro host)│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              PC(s) de desarrollo del equipo               │
│  - Engine y tests corren aquí durante desarrollo          │
│    (fixtures sintéticas, sin depender de la Raspberry)    │
│  - API (Node.js) y Frontend (React) en desarrollo local   │
└─────────────────────────────────────────────────────────┘
```

## Notas

- Solo las **pruebas de integración final** requieren la Raspberry Pi física; el desarrollo diario del Engine, API y Frontend se hace en los PCs del equipo (ver `docs/testing/estrategia-de-pruebas.md`).
- El honeypot corre en una red Docker aislada del resto de los servicios (ver `docs/arquitectura/threat-model.md`).
- La API y el Frontend, si se despliegan para la demo de UNICTEC, pueden alojarse fuera de la Raspberry (p. ej. en un laptop del equipo) para no competir por recursos con el pipeline de telemetría.
- Para la prueba propuesta en OTI UNI, el SSD contiene datos y logs, se monta por UUID y se valida antes del despliegue. El Wazuh manager, la API y el frontend deben ejecutarse fuera de la Raspberry si comprometen el margen de 2 GB.

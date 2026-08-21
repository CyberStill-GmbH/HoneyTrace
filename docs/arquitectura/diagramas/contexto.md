# Diagrama de contexto (C4 - Nivel 1)

## Descripción

Vista de más alto nivel: HoneyTrace como sistema único y sus actores externos.

```
                    ┌───────────────────────┐
                    │       Atacante        │
                    │ (real o controlado)   │
                    └───────────┬───────────┘
                                │ interactúa vía HTTP
                                ▼
                 ┌─────────────────────────────┐
                 │          HoneyTrace          │
                 │  (honeypot + engine + API +  │
                 │        frontend)             │
                 └───────┬───────────────┬──────┘
                         │               │
             telemetría  │               │ resultados / dashboard
                         ▼               ▼
                 ┌───────────────┐  ┌───────────────┐
                 │  Wazuh (SIEM) │  │ Equipo/Investi-│
                 │               │  │ gadores        │
                 └───────────────┘  └───────────────┘
```

## Actores externos

- **Atacante**: genera tráfico e interacciones contra el Web Honeypot. Puede ser un miembro del equipo ejecutando un escenario controlado, o un visitante en demo.
- **Wazuh (SIEM)**: sistema externo que recibe telemetría en paralelo, usado como línea base de comparación.
- **Equipo / investigadores**: consumen el dashboard, el Attack Explorer y los resultados de investigación; operan y mantienen el sistema.

## Fuera del límite del sistema

- Infraestructura de producción del equipo (explícitamente aislada, ver `threat-model.md`).
- Sistemas de terceros (nunca objetivo de los ataques controlados).

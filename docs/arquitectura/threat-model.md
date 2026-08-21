# Threat model

## Propósito

Este documento describe los riesgos de operar un honeypot deliberadamente vulnerable, y las medidas de aislamiento y contención adoptadas para que la investigación no genere riesgo hacia el equipo, la red del laboratorio ni terceros.

## Activos a proteger

- La red y los dispositivos del equipo (fuera del honeypot).
- Los datos de investigación (telemetría, datasets, resultados) frente a manipulación o pérdida.
- La integridad del propio pipeline de HoneyTrace (Collector, Normalizer, Engine) frente a abuso desde el honeypot.
- La Raspberry Pi y el SSD frente a uso como pivote hacia otros sistemas.

## Actores

| Actor | Descripción | Confianza |
|-------|-------------|-----------|
| Atacante externo/controlado | Persona (del equipo o invitada en demo) que interactúa con el honeypot para generar telemetría | No confiable |
| Miembros del equipo | Desarrollan, despliegan y operan el sistema | Confiable, con revisión por PR |
| Personal o participantes autorizados | Podrían interactuar con el honeypot durante una prueba aprobada por OTI UNI | No confiable |

## Superficie de ataque del honeypot

- Login, dashboard, usuarios, productos/recursos, API, panel de administración, base de datos — deliberadamente vulnerables, según `docs/requisitos/requisitos.md` (RF-01).
- El objetivo es que esta superficie sea explotable **dentro del honeypot**, nunca que sirva como puente hacia el resto de la infraestructura.

## Controles de aislamiento (obligatorios antes de exponer el honeypot)

1. **Segmentación de red**: el honeypot debe correr en una red/VLAN o red Docker separada, sin rutas hacia la red de gestión, hacia Internet más allá de lo estrictamente necesario, ni hacia otros servicios del proyecto (Collector, Normalizer, Engine, API, Wazuh se comunican solo por los canales definidos, nunca exponiendo el honeypot como origen de conexiones salientes libres).
2. **Sin datos reales**: el honeypot nunca debe contener credenciales, datos personales o información sensible real; todos los usuarios/datos son sintéticos.
3. **Contenedorización**: el honeypot corre en un contenedor Docker separado del resto del stack, con recursos limitados (CPU/memoria) y sin privilegios elevados.
4. **Persistencia controlada**: los datos generados por el honeypot (incluida cualquier base de datos comprometida) se consideran desechables y se resetean entre sesiones de prueba/demo.
5. **Monitoreo del propio honeypot**: Wazuh y la observabilidad interna vigilan también el honeypot, no solo lo que este reporta sobre "ataques"; cualquier intento de pivoting hacia fuera del contenedor debe generar alerta.
6. **Acceso de administración separado**: el panel de administración del honeypot es parte de la superficie vulnerable; el acceso real de operación del sistema (Collector, Engine, dashboards reales) usa credenciales y red distintas.
7. **Autorización institucional**: antes de OTI UNI deben constar por escrito ventana, responsable, VLAN/puerto, tráfico permitido, retención y procedimiento de cierre.
8. **Contención de vulnerabilidades**: Path Traversal solo puede recorrer el filesystem señuelo; SQLi solo accede a datos sintéticos; Stored XSS solo se renderiza en la vista señuelo aislada.

## Riesgos considerados

| Riesgo | Mitigación |
|--------|------------|
| El atacante usa el honeypot como pivote hacia la red del laboratorio | Segmentación de red / Docker network aislada |
| Fuga de datos reales del equipo a través del honeypot | Prohibición de datos reales; solo datos sintéticos |
| Denegación de servicio contra la Raspberry Pi | Límites de recursos por contenedor, rate limiting |
| Corrupción del pipeline de telemetría por payloads maliciosos | Validación/parseo defensivo en Collector y Normalizer (nunca ejecutar contenido recibido) |
| Exposición accidental del honeypot fuera de la demo controlada | Reglas de firewall explícitas, revisión antes de cada demo pública |

## Alcance ético

Todos los ataques contra el honeypot en el marco de esta investigación son ejecutados por el propio equipo (o, en demo, por visitantes interactuando con una superficie deliberadamente ofrecida para ese fin), dentro de un entorno controlado. No se atacan sistemas de terceros ni se usa el honeypot para actividad ofensiva fuera de este proyecto.

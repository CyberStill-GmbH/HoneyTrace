# Integración Wazuh

HoneyTrace entrega un evento JSON por línea en `events.ndjson`. Wazuh puede leer el mismo archivo en paralelo al Collector; no debe modificarlo ni moverlo.

1. Montar el SSD de logs en el agente Wazuh como `/var/log/honeytrace`.
2. Añadir el contenido de `honeytrace-localfile.xml` a `ossec.conf`.
3. Reiniciar el agente y validar que `alerts.json` recibe eventos con `event_type`, `trace_id`, `vulnerability` y `outcome`.
4. Conservar los eventos originales para que Engine y Wazuh trabajen sobre la misma evidencia.

La rotación del honeypot mantiene archivos de 5 MiB y dos respaldos; configurar la retención de Wazuh para no duplicar indefinidamente el almacenamiento de la Raspberry Pi.

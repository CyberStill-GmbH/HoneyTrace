# Plan de prueba controlada en OTI UNI

## Ventana propuesta

**Fecha:** jueves 10 de septiembre de 2026  
**Horario:** 09:00–13:00, America/Lima  
**Estado:** propuesta pendiente de confirmación escrita por OTI UNI.

No se conectará el equipo si faltan autorización, responsable institucional presente, segmento de red definido o procedimiento de retiro aprobado.

## Equipo físico

- Raspberry Pi con 2 GB de RAM.
- SSD SATA y adaptador SATA–USB para uso externo, proporcionados para la prueba.
- Fuente de poder adecuada y cable de repuesto.
- Cable Ethernet probado; adaptador de red si corresponde.
- Disipación o ventilación y forma de medir temperatura.
- Laptop de administración, cable/consola de contingencia y etiquetas de inventario.

El SSD y el adaptador deben recibirse y probarse antes del 1 de septiembre. Registrar marca, modelo, capacidad, identificador, estado físico, responsable de entrega y devolución.

## Información que OTI UNI debe confirmar

- Responsable técnico y contacto durante la ventana.
- Puerto/VLAN, direccionamiento, DNS/NTP y conectividad permitida.
- Lista de IP, puertos y protocolos autorizados.
- Restricciones de salida, retención y tratamiento de datos.
- Ubicación física, energía y condiciones de acceso.
- Procedimiento de emergencia, retiro y constancia de cierre.

## Checklist Go/No-Go — 9 de septiembre

- [ ] Autorización y alcance firmados.
- [ ] Prueba de regresión completa aprobada.
- [ ] Ensayo continuo de 4 horas aprobado en el mismo hardware.
- [ ] Firewall de salida, usuario sin privilegios y aislamiento verificados.
- [ ] SSD montado por UUID y con espacio suficiente; reinicio probado.
- [ ] Rotación de logs, límites de recursos y sincronización horaria verificados.
- [ ] Respaldo, hashes, versiones y configuración guardados.
- [ ] Procedimiento de apagado y retiro ensayado.
- [ ] Contactos, transporte, acceso físico y devolución del equipo confirmados.

Cualquier casilla pendiente produce **No-Go** salvo aceptación documentada del LT y OTI UNI; los controles de autorización y aislamiento nunca admiten excepción.

## Ejecución del 10 de septiembre

1. 09:00–09:30 — ingreso, inventario, confirmación de alcance y conexión al segmento aprobado.
2. 09:30–10:00 — healthcheck, hora, recursos, puertos y captura de línea base.
3. 10:00–12:00 — operación y tráfico de prueba autorizado; monitoreo continuo.
4. 12:00–12:30 — validación de evidencia, métricas y estado del dispositivo.
5. 12:30–13:00 — apagado, desconexión, verificación de puertos, inventario y acta de cierre.

## Responsabilidades durante la prueba

- **LT:** decisión Go/No-Go, cambios técnicos, seguridad, comunicación con OTI y detención.
- **IA:** bitácora cronológica, casos de prueba y evidencia funcional.
- **IB:** recursos, temperatura, disco, red e inventario físico.
- **OTI UNI:** autorización, segmento, acompañamiento, comunicación de incidentes y confirmación de cierre.

## Condiciones de detención inmediata

- Tráfico hacia sistemas no autorizados o intento de movimiento lateral.
- Acceso al host o a datos fuera del filesystem señuelo.
- Pérdida de acceso administrativo o incapacidad de detener el servicio.
- Uso sostenido crítico de memoria, disco o temperatura.
- Solicitud del responsable de OTI UNI o cualquier impacto institucional.

Al detener: desconectar red si es seguro, preservar evidencia mínima, registrar hora y causa, informar a OTI UNI y no reanudar sin nueva autorización.

## Evidencia y cierre

Conservar bitácora, versión desplegada, configuración sin secretos, métricas, logs autorizados, hashes, incidentes y acta de retiro. Dentro de las 24 horas se realizará revisión técnica; dentro de las 48 horas, retrospectiva y decisión sobre conservación o borrado de datos.

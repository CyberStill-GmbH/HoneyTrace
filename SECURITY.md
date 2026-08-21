# Política de seguridad de HoneyTrace

HoneyTrace es un sistema de investigación con vulnerabilidades deliberadas. No es una aplicación de producción.

## Alcance permitido

- Laboratorio local o segmento de red expresamente autorizado.
- Datos sintéticos; nunca credenciales, documentos o información personal reales.
- Tráfico generado por el equipo o recibido dentro del alcance aprobado por OTI UNI.
- Acceso administrativo desde una interfaz o red separada de las rutas vulnerables.

## Controles obligatorios antes de una prueba

- [ ] Autorización escrita, fecha, ventana horaria y contacto de OTI UNI.
- [ ] VLAN o red aislada, sin ruta hacia sistemas internos.
- [ ] Sin secretos en repositorio, imagen Docker, logs o datos señuelo.
- [ ] Límites de CPU, memoria, disco y rotación de logs configurados.
- [ ] Firewall de salida con política de denegación por defecto.
- [ ] Sin montaje de `/var/run/docker.sock`, directorios del host ni dispositivos innecesarios.
- [ ] Procedimiento de apagado, retiro y borrado seguro probado.
- [ ] Reloj sincronizado y zona horaria documentada.

## Manejo de datos

Se recolectará el mínimo necesario: timestamp, IP seudonimizada para el análisis publicado, método, ruta, código HTTP, latencia, agente de usuario, tipo de evento y hash del payload cuando sea suficiente. Los payloads completos requieren justificación y acceso restringido. La retención inicial propuesta es de 30 días y debe ser aprobada antes de la prueba.

## Reporte

Una vulnerabilidad no intencional que permita escapar del contenedor, acceder al host, afectar terceros o filtrar secretos detiene inmediatamente la prueba. Regístrala como incidente, conserva evidencia mínima y notifícala al Líder Técnico y al contacto institucional.

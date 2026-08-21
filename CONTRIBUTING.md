# Contribución a HoneyTrace

## Flujo de trabajo

1. Selecciona una historia del sprint con responsable y criterio de aceptación.
2. Crea una rama corta (`feature/`, `fix/`, `docs/` o `test/`).
3. Implementa un cambio pequeño y añade o actualiza pruebas.
4. Abre una revisión; ninguna persona aprueba su propio cambio complejo.
5. Adjunta evidencia: comando ejecutado, resultado esperado y captura o log cuando aplique.

## Distribución para el equipo de tres

- **Líder Técnico (LT):** arquitectura, vulnerabilidades deliberadas, aislamiento, modelo de eventos, integración y decisiones de alto riesgo.
- **Integrante A (IA, junior):** pruebas funcionales, datos sintéticos, documentación operativa y endpoints CRUD guiados.
- **Integrante B (IB, junior):** Docker/Raspberry Pi siguiendo runbooks, dashboards guiados, inventario y evidencia de pruebas.

IA e IB deben trabajar con tareas de máximo un día, ejemplos de referencia y revisión del LT. Se recomienda programación en pareja para cambios en seguridad, base de datos o despliegue.

## Definition of Done

Una tarea solo se marca `[x]` cuando:

- el código o documento está versionado;
- tiene criterio de aceptación comprobado;
- pasan pruebas relevantes y `alembic check` cuando afecta persistencia;
- no introduce secretos ni acceso fuera del laboratorio;
- fue revisada por otra persona;
- actualiza documentación y evidencia del sprint.

Los estados permitidos son `[ ]` pendiente y `[x]` completado. El trabajo parcial permanece pendiente y se explica en la revisión del sprint.

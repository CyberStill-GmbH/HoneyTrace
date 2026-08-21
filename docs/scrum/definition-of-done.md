# Definition of Done (DoD)

Una tarea se considera terminada cuando:

- [ ] El código cumple los criterios de aceptación de la issue.
- [ ] Pasa lint y todos los checks de CI (`.github/workflows/ci.yml`).
- [ ] Incluye tests en el nivel correspondiente (ver `docs/testing/estrategia-de-pruebas.md`) y estos pasan.
- [ ] La documentación relevante está actualizada (`docs/arquitectura`, `docs/requisitos`, `/schemas`, README del componente).
- [ ] Si cambia una decisión de arquitectura, existe un ADR actualizado o nuevo (`docs/adr/`).
- [ ] El PR fue revisado y aprobado por al menos un miembro del equipo.
- [ ] Si es una tarea de investigación: el resultado está registrado en `research/results/` o `research/analysis/`, y referenciado desde `docs/investigacion/estado-del-arte.md` si aplica.
- [ ] La issue se cierra automáticamente vía el PR (`Closes #`).

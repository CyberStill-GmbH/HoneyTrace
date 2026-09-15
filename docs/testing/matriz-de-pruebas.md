# Matriz de pruebas

> Estado consolidado al cierre de UNITEC 2026. Relaciona requisitos (`docs/requisitos/requisitos.md`) con los niveles de prueba incluidos en el repositorio.

| Requisito | Descripción breve | Unit | Integration | E2E | Física (RPi) | Estado |
|-----------|--------------------|:----:|:-----------:|:---:|:-------------:|--------|
| RF-01 | Cinco APIs vulnerables contenidas | ✓ | ✓ | ✓ | ✓ | Cubierto |
| RF-02 | Telemetría HTTP | ✓ | ✓ | ✓ | – | Cubierto |
| RF-03 | Telemetría de aplicación | ✓ | ✓ | ✓ | – | Cubierto |
| RF-04 | Telemetría de base de datos (`DB_QUERY`/`DB_ERROR`) | ✓ | ✓ | ✓ | – | Cubierto |
| RF-05 | Telemetría de sistema (`SYSTEM_METRIC`) | ✓ | ✓ | ✓ | ✓ | Cubierto |
| RF-06 | Collector captura/parsea/envía | ✓ | ✓ | – | – | Cubierto |
| RF-07 | Normalizer produce NormalizedEvent | ✓ | ✓ | – | – | Cubierto |
| RF-08 | Correlation Engine agrupa eventos (Rust) | ✓ | ✓ | ✓ | – | Cubierto |
| RF-09 | Attack Reconstruction produce AttackTrace (Rust) | ✓ | ✓ | ✓ | – | Cubierto |
| RF-10 | Telemetría en paralelo a Wazuh | – | ✓ | ✓ | – | Cubierto |
| RF-11 | Endpoints de la API | ✓ | ✓ | ✓ | – | Cubierto |
| RF-12 | Dashboard del frontend | ✓ | ✓ | – | – | Cubierto |
| RF-13 | Attack Explorer (timeline + 3D) | ✓ | ✓ | – | – | Cubierto |
| RF-14 | Comparación contra ground truth | – | – | – | – | Extensión de investigación fuera del cierre |

## Convenciones

- `✓` indica que el repositorio contiene cobertura en ese nivel.
- `–` indica que el nivel no aplica o quedó fuera del alcance final.

La suite `tests/physical/` valida el contrato de recursos de Raspberry Pi (Linux, `/proc`, disco montado y límites de log). En CI se ejecuta como contrato Linux; no equivale a una aceptación del hardware real. Esa validación física quedó como extensión posterior a UNITEC 2026.

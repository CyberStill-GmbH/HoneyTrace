# Matriz de pruebas

> Relaciona requisitos (`docs/requisitos/requisitos.md`) con el nivel de prueba que los cubre. Actualizar a medida que se implementan tests.

| Requisito | Descripción breve | Unit | Integration | E2E | Física (RPi) | Estado |
|-----------|--------------------|:----:|:-----------:|:---:|:-------------:|--------|
| RF-01 | Cinco APIs vulnerables contenidas | ✓ | ✓ | ✓ | ✓ | Cubierto |
| RF-02 | Telemetría HTTP | ✓ | ✓ | ✓ | – | Cubierto |
| RF-03 | Telemetría de aplicación | ✓ | ✓ | ✓ | – | Cubierto |
| RF-04 | Telemetría de base de datos (`DB_QUERY`/`DB_ERROR`) | ✓ | ✓ | ✓ | – | Cubierto |
| RF-05 | Telemetría de sistema (`SYSTEM_METRIC`) | ✓ | ✓ | ✓ | ✓ | Cubierto |
| RF-06 | Collector captura/parsea/envía | ✓ | ✓ | – | – | Cubierto |
| RF-07 | Normalizer produce NormalizedEvent | ✓ | ✓ | – | – | Cubierto |
| RF-08 | Correlation Engine agrupa eventos (Rust) | ✓ | ✓ | – | – | En progreso — núcleo determinista cubierto; falta integración con dataset completo |
| RF-09 | Attack Reconstruction produce AttackTrace (Rust) | ✓ | ✓ | – | – | En progreso — reglas y scoring cubiertos; falta ground truth por escenario |
| RF-10 | Telemetría en paralelo a Wazuh | – | ✓ | ✓ | – | Cubierto |
| RF-11 | Endpoints de la API | ✓ | ✓ | ✓ | – | Cubierto |
| RF-12 | Dashboard del frontend | – | – | - | – | Pendiente |
| RF-13 | Attack Explorer (timeline + 3D) | – | – | - | – | Pendiente |
| RF-14 | Comparación contra ground truth | – | - | – | - | Pendiente |

## Convenciones

- ✅ = nivel de prueba aplicable y planificado para este requisito.
- Estado: `Pendiente` / `En progreso` / `Cubierto`. El Engine tiene cobertura contractual y de pipeline, pero no se marca `Cubierto` hasta validar los cinco escenarios contra ground truth.

La suite `tests/physical/` valida el contrato de recursos de Raspberry Pi (Linux, `/proc`, disco montado y límites de log). En CI se ejecuta como contrato Linux; la aceptación final de hardware requiere repetirla en la Raspberry Pi 2 GB con el SSD real y adjuntar sus resultados.

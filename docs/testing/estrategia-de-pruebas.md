# Estrategia de pruebas

## Objetivo

Garantizar que el pipeline de HoneyTrace (especialmente Normalizer, Correlation Engine y Attack Reconstruction) sea correcto y verificable, permitiendo que el desarrollo avance sin depender de la Raspberry Pi, dado que un integrante trabajará remoto.

## Niveles de prueba

### 1. Unit tests
- Ámbito: funciones puras y módulos aislados (parsers del Collector, transformaciones del Normalizer, reglas individuales del Correlation Engine, clasificadores de etapas de Attack Reconstruction).
- Ubicación: junto a cada componente (`honeypot/tests`, `collector/tests`, `engine/tests` cuando se incorpore Rust, `api/tests`, `frontend/tests`).
- Ejecutan en CI en cada push/PR (ver `.github/workflows/ci.yml`).

### 2. Integration tests
- Ámbito: flujo entre dos o más componentes (p. ej. Collector → Normalizer → Engine) usando datos sintéticos de `tests/fixtures/`, sin necesidad de la Raspberry Pi ni del honeypot real.
- Ejemplo: alimentar `tests/fixtures/bruteforce.json` al pipeline completo del Engine y comparar el `AttackTrace` producido contra `expected_trace.json`.

### 3. E2E tests
- Ámbito: honeypot real (o contenedorizado localmente) generando telemetría real, pasando por todo el pipeline hasta la API/Frontend.
- Requiere entorno Docker Compose completo; idealmente ejecutable en cualquier PC del equipo, y obligatorio antes de una demo o de pruebas finales en la Raspberry.

### 4. Pruebas de integración física (Raspberry Pi)
- Ámbito: validar que el sistema completo funciona con los límites reales de hardware (RNF-01) y con la red aislada del honeypot (threat-model.md).
- Solo necesarias en hitos clave (fin de sprint, previo a la demo de UNICTEC), no en cada cambio.

## Datos de prueba

```
tests/fixtures/bruteforce.json
        ↓
  HoneyTrace Engine
        ↓
 expected_trace.json
```

Cada escenario de ataque documentado en `escenarios-de-ataque.md` debe tener:
- Un fixture de eventos (crudos y/o normalizados).
- Un `expected_trace.json` con el `AttackTrace` esperado (ground truth), usado tanto para tests automatizados como para las métricas de investigación (`docs/investigacion/metodologia.md`).

## Cobertura mínima esperada (Definition of Done relacionado)

- Normalizer: cobertura de unit tests para cada tipo de fuente soportada.
- Correlation Engine: al menos un test de integración por escenario de ataque documentado.
- Attack Reconstruction: comparación automatizada contra `expected_trace.json` para cada escenario.
- API: tests de contrato para cada endpoint expuesto.

## Herramientas

| Componente | Framework de testing |
|------------|----------------------|
| Honeypot / Collector (Python) | pytest |
| Engine (Rust) | cargo test |
| API (Node/TypeScript) | vitest o jest |
| Frontend (React) | vitest/testing-library |
| CI | GitHub Actions (`ci.yml`) |

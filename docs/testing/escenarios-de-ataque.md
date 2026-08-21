# Escenarios de ataque

> Cada escenario aquí documentado debe tener su fixture correspondiente en `tests/fixtures/` y su `expected_trace.json` (ground truth), usados tanto para testing como para los experimentos de investigación (`docs/investigacion/metodologia.md`).

## Plantilla de escenario

```
### Nombre del escenario
- Objetivo del atacante:
- Superficie objetivo (endpoint/componente del honeypot):
- Pasos ejecutados (guion, con timestamps relativos):
- Etapas esperadas (ground truth) según el modelo de Attack Reconstruction:
- Fixture: tests/fixtures/<nombre>.json
- Ground truth: tests/fixtures/<nombre>_expected_trace.json
```

## Escenario 1: Fuerza bruta de login

- **Objetivo del atacante:** obtener acceso válido probando credenciales contra `/auth`.
- **Superficie objetivo:** endpoint de autenticación del honeypot.
- **Pasos ejecutados:**
  1. `GET /auth` (reconocimiento)
  2. Múltiples `POST /auth` con credenciales distintas → `Authentication failure` repetidas
  3. `POST /auth` exitoso → `Authentication success`
  4. Acceso a recursos protegidos (`GET /dashboard`, `GET /admin`)
- **Etapas esperadas:** Recon → Login probing → Brute force → Authentication success → Admin access.
- **Fixture:** `tests/fixtures/bruteforce.json`
- **Ground truth:** `tests/fixtures/bruteforce_expected_trace.json`

## Escenario 2: IDOR en usuarios

- **Objetivo del atacante:** consultar usuarios ajenos modificando una referencia directa.
- **Superficie objetivo:** `/users/:id`.
- **Pasos ejecutados:** secuencia de requests con IDs/nombres incrementales o de diccionario, observando códigos de respuesta.
- **Etapas esperadas:** Recon → Enumeration → (opcional) Data exposure.
- **Fixture:** `tests/fixtures/enumeration.json` *(pendiente de crear)*

## Escenario 3: SQL Injection en productos

- **Objetivo del atacante:** alterar una consulta del catálogo mediante entrada SQL manipulada.
- **Superficie objetivo:** `/products`.
- **Pasos ejecutados:** payloads de prueba, observación de errores de base de datos o bypass de autenticación.
- **Etapas esperadas:** Recon → Input testing → Exploitation → (opcional) Authentication bypass / Data exposure.
- **Fixture:** `tests/fixtures/injection.json` *(pendiente de crear)*

## Escenario 4: Path Traversal en archivos

- **Objetivo del atacante:** leer archivos fuera de la ruta lógica permitida, pero dentro del filesystem señuelo.
- **Superficie objetivo:** `/files`.
- **Pasos ejecutados:** solicitudes con secuencias de navegación y codificaciones equivalentes, verificando que nunca alcancen el host.
- **Etapas esperadas:** Recon → Input testing → Path traversal → Decoy file access.
- **Fixture:** `tests/fixtures/path_traversal.json` *(pendiente de crear)*

## Escenario 5: Stored XSS mediante Note

- **Objetivo del atacante:** almacenar contenido activo en una nota y observar su ejecución en la vista señuelo.
- **Superficie objetivo:** `/orders` y el campo `Note`.
- **Pasos ejecutados:** crear orden o nota con payload etiquetado, recuperar la orden y abrirla únicamente en el renderizador aislado.
- **Etapas esperadas:** Recon → Input testing → Payload storage → Triggered rendering.
- **Fixture:** `tests/fixtures/stored_xss.json` *(pendiente de crear)*

## Pendientes

- [ ] Crear fixtures y `expected_trace.json` para los cinco escenarios.
- [ ] Ejecutar cada escenario también contra Wazuh y registrar sus alertas para la comparación de `docs/investigacion/metodologia.md`.

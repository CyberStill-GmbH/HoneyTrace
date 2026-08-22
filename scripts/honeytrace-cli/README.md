# MielEnjoyer CLI

Herramienta CLI en Go para la ejecución y verificación controlada de vectores de ataque de seguridad contra la infraestructura del Honeypot de HoneyTrace.

---

## Funcionalidades de la Herramienta

- **Interfaz de Usuario en Terminal (TUI):** Selección interactiva de vectores de ataque mediante teclado, configuración de URL objetivo y confirmación de laboratorio.
- **Formato Estructurado de Veredictos:** Visualización limpia de resultados de ejecución en consola con indicación de estado por paso y resumen en tabla.
- **Modo Automatización (CI/CD):** Salida en formato `JSON Lines` (`--json`) para integración en herramientas de monitoreo o pipelines de CI/CD.
- **Control de Seguridad:** Validación obligatoria de confirmación de entorno de laboratorio aislado (`--confirm-lab`).
- **Verificación de evidencia:** además del código HTTP, cada ataque comprueba un marcador observable en la respuesta cuando es necesario (objeto IDOR, filas SQLi, archivo decoy y payload XSS).
- **Destino validado:** sólo acepta URLs absolutas `http`/`https`; rechaza rutas locales o esquemas no HTTP.

---

## Vectores de Ataque Soportados

| Escenario | Descripción del Vector | Endpoint Objetivo | Estado Esperado |
| :--- | :--- | :--- | :--- |
| `bruteforce` | Adivinación de credenciales y autenticación posterior | `POST /auth` | 401 / 200 |
| `idor` | Referencia directa insegura a objetos mediante cabeceras | `GET /users/2` (vía `X-User-ID`) | 200 |
| `sqli` | Inyección SQL en parámetros de búsqueda | `GET /products?q=...` | 200 |
| `path-traversal` | Intentos de lectura de archivos decoy y escape | `GET /files?path=...` | 200 / 403 |
| `stored-xss` | Inyección y renderizado de scripts en notas | `POST/GET /orders/1/notes` | 201 / 200 |
| `all` | Ejecución secuencial de todos los vectores anteriores | Todos | Múltiple |

---

## Compilación y Uso de la Herramienta

### Compilación

```powershell
go build -o honeytrace-cli.exe .
```

### Modo Interactivo (TUI)

Ejecutar sin argumentos abre el menú interactivo:

```powershell
.\honeytrace-cli.exe
```

### Modo CLI (Banderas explícitas)

```powershell
.\honeytrace-cli.exe --base-url http://127.0.0.1:8000 --scenario sqli --confirm-lab
```

### Modo JSON para Automatización

```powershell
.\honeytrace-cli.exe --base-url http://127.0.0.1:8000 --scenario all --confirm-lab --json
```

---

## Calidad y límites de los veredictos

Un paso `PASS` significa que el endpoint respondió con el estado esperado y, cuando aplica, que apareció la evidencia mínima del comportamiento vulnerable. No significa que se haya probado una explotación fuera del honeypot ni que exista impacto en un sistema real. Los cuerpos completos no se imprimen por defecto: se conserva tamaño y SHA-256 para trazabilidad sin inundar la terminal.

## Descargo de Responsabilidad

Esta herramienta debe ejecutarse exclusivamente dentro de entornos de laboratorio aislados y autorizados.

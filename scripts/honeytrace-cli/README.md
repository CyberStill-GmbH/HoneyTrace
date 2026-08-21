# HoneyTrace CLI (Go)

CLI para ejecutar ataques reales y controlados únicamente contra el honeypot autorizado. Requiere `--base-url` y `--confirm-lab`; sin ambos se niega a ejecutar.

```powershell
go run . --base-url http://127.0.0.1:8000 --scenario all --confirm-lab
```

Los payloads son patrones de explotación para las cinco rutas del honeypot. No descubre hosts, no escanea redes y no debe apuntar a terceros. Ejecutar solo dentro de la red aislada documentada en `docs/arquitectura/threat-model.md`.

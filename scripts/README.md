# Scripts de laboratorio

Esta carpeta queda reservada para herramientas de laboratorio en Go o Rust. Cualquier herramienta futura debe exigir una URL objetivo explícita, limitarse al honeypot autorizado, no descubrir hosts ni escanear redes y documentar sus payloads y límites.

- [`raspberry-pi/`](raspberry-pi/README.md): instalación reproducible del honeypot en Raspberry Pi 4 Model B de 2 GB con persistencia en SSD SATA y arranque automático mediante `systemd`.

La evidencia oficial de una ejecución debe incluir logs NDJSON, `trace_id`, commit, configuración, autorización y alcance de red.

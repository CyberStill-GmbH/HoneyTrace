# Despliegue en Raspberry Pi 4 Model B (2 GB)

Este instalador prepara Raspberry Pi OS de 64 bits para ejecutar únicamente el honeypot y su PostgreSQL. El frontend, la API del visualizador y Wazuh Manager deben permanecer en otro equipo para conservar memoria.

El sistema operativo puede seguir arrancando desde microSD. El SSD SATA conectado por USB se monta por UUID y almacena la base de datos y los logs; `systemd` inicia HoneyTrace automáticamente después de montar el SSD.

## Requisitos

- Raspberry Pi 4 Model B de 2 GB con Raspberry Pi OS Lite de 64 bits.
- SSD SATA con adaptador SATA–USB compatible y alimentación suficiente.
- Repositorio HoneyTrace clonado en una ruta permanente de la Pi.
- Segmento de laboratorio autorizado y aislado.

Identifica primero la partición correcta:

```bash
lsblk -o NAME,PATH,TYPE,FSTYPE,SIZE,MOUNTPOINTS,MODEL
```

Para usar una partición ext4 existente:

```bash
sudo ./scripts/raspberry-pi/install.sh --ssd-partition /dev/sda1
```

Para borrar y formatear explícitamente esa partición:

```bash
sudo ./scripts/raspberry-pi/install.sh \
  --ssd-partition /dev/sda1 \
  --format \
  --confirm-erase /dev/sda1
```

El honeypot escucha sólo en `127.0.0.1` por defecto. Durante una prueba autorizada, usa la IP concreta de la interfaz del laboratorio; no uses `0.0.0.0` sin reglas externas de aislamiento:

```bash
sudo ./scripts/raspberry-pi/install.sh \
  --ssd-partition /dev/sda1 \
  --bind-address 192.0.2.20
```

## Operación

```bash
sudo systemctl status honeytrace-rpi
sudo journalctl -u honeytrace-rpi -f
sudo ./scripts/raspberry-pi/healthcheck.sh
sudo systemctl restart honeytrace-rpi
sudo systemctl stop honeytrace-rpi
```

La configuración local queda en `/etc/honeytrace/raspberry.env` con permisos `0600`. Los datos se conservan al detener el servicio. El instalador guarda una copia fechada de `/etc/fstab` antes de actualizar su bloque administrado.

Antes de conectar la Pi a una red institucional, completa el checklist de `docs/oti_uni_test_plan.md`. El SSD y algunos adaptadores SATA–USB pueden requerir alimentación externa; valida escritura sostenida, reinicio, temperatura y estabilidad del enlace USB antes de la prueba.


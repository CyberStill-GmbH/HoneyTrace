#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_DIR="/etc/honeytrace"
ENV_FILE="${ENV_DIR}/raspberry.env"
TOKEN_FILE="${ENV_DIR}/ingest-token"
SERVICE_FILE="/etc/systemd/system/honeytrace-rpi.service"

SSD_PARTITION=""
MOUNT_POINT="/srv/honeytrace"
BIND_ADDRESS="127.0.0.1"
HONEYPOT_PORT="8000"
FORMAT_SSD="false"
CONFIRM_ERASE=""
API_URL=""
INGEST_TOKEN_FILE=""
SOURCE_ID="$(hostname -s 2>/dev/null || echo raspberry-pi)"

usage() {
  cat <<'EOF'
Uso:
  sudo ./scripts/raspberry-pi/install.sh --ssd-partition /dev/sda1 [opciones]

Opciones:
  --ssd-partition RUTA   Partición del SSD SATA; debe ser una partición, no el disco completo.
  --mount-point RUTA     Punto de montaje persistente (predeterminado: /srv/honeytrace).
  --bind-address IP      IP donde exponer el honeypot (predeterminado: 127.0.0.1).
  --port PUERTO          Puerto HTTP del honeypot (predeterminado: 8000).
  --api-url URL          API del visualizador accesible desde la Raspberry.
  --ingest-token-file RUTA
                         Archivo que contiene el token creado en Dispositivos.
  --source-id NOMBRE     Identificador visible de esta fuente (predeterminado: hostname).
  --format               Formatea la partición como ext4. Borra todos sus datos.
  --confirm-erase RUTA   Confirmación obligatoria; debe coincidir exactamente con --ssd-partition.
  --help                 Muestra esta ayuda.

Sin --format, la partición debe contener ya un sistema de archivos ext4.
EOF
}

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

while (($#)); do
  case "$1" in
    --ssd-partition) SSD_PARTITION="${2:-}"; shift 2 ;;
    --mount-point) MOUNT_POINT="${2:-}"; shift 2 ;;
    --bind-address) BIND_ADDRESS="${2:-}"; shift 2 ;;
    --port) HONEYPOT_PORT="${2:-}"; shift 2 ;;
    --api-url) API_URL="${2:-}"; shift 2 ;;
    --ingest-token-file) INGEST_TOKEN_FILE="${2:-}"; shift 2 ;;
    --source-id) SOURCE_ID="${2:-}"; shift 2 ;;
    --format) FORMAT_SSD="true"; shift ;;
    --confirm-erase) CONFIRM_ERASE="${2:-}"; shift 2 ;;
    --help) usage; exit 0 ;;
    *) fail "argumento desconocido: $1" ;;
  esac
done

[[ ${EUID} -eq 0 ]] || fail "ejecuta este instalador con sudo"
[[ -n "${SSD_PARTITION}" ]] || { lsblk -o NAME,PATH,TYPE,FSTYPE,SIZE,MOUNTPOINTS,MODEL; fail "indica --ssd-partition"; }
[[ "${API_URL}" =~ ^https?://[^[:space:]]+$ ]] || fail "indica --api-url con http:// o https://"
[[ -r "${INGEST_TOKEN_FILE}" ]] || fail "indica un --ingest-token-file legible"
[[ "${SOURCE_ID}" =~ ^[a-zA-Z0-9._-]{1,128}$ ]] || fail "--source-id admite letras, números, punto, guion y guion bajo"
[[ "${MOUNT_POINT}" = /* ]] || fail "--mount-point debe ser una ruta absoluta"
[[ "${HONEYPOT_PORT}" =~ ^[0-9]+$ ]] && ((HONEYPOT_PORT >= 1024 && HONEYPOT_PORT <= 65535)) || fail "puerto inválido"
[[ "${BIND_ADDRESS}" =~ ^[0-9a-fA-F:.]+$ ]] || fail "dirección de escucha inválida"
[[ -b "${SSD_PARTITION}" ]] || fail "${SSD_PARTITION} no es un dispositivo de bloques"
[[ "$(lsblk -ndo TYPE "${SSD_PARTITION}")" == "part" ]] || fail "usa una partición como /dev/sda1, no un disco completo"

ARCH="$(dpkg --print-architecture)"
[[ "${ARCH}" == "arm64" ]] || fail "se requiere Raspberry Pi OS de 64 bits (arm64); detectado: ${ARCH}"
MODEL="$(tr -d '\0' </proc/device-tree/model 2>/dev/null || true)"
[[ "${MODEL}" == *"Raspberry Pi 4 Model B"* ]] || fail "este instalador requiere Raspberry Pi 4 Model B; detectado: ${MODEL:-desconocido}"

SSD_PARTITION="$(readlink -f -- "${SSD_PARTITION}")"
ROOT_SOURCE="$(findmnt -n -o SOURCE / | sed 's/\[.*//')"
ROOT_SOURCE="$(readlink -f -- "${ROOT_SOURCE}")"
ROOT_DISK="/dev/$(lsblk -ndo PKNAME "${ROOT_SOURCE}" 2>/dev/null || basename "${ROOT_SOURCE}")"
SSD_DISK="/dev/$(lsblk -ndo PKNAME "${SSD_PARTITION}")"
[[ "${ROOT_DISK}" != "${SSD_DISK}" ]] || fail "el SSD seleccionado contiene el sistema raíz"

if [[ "${FORMAT_SSD}" == "true" ]]; then
  [[ "${CONFIRM_ERASE}" == "${SSD_PARTITION}" ]] || fail "para formatear usa --confirm-erase ${SSD_PARTITION}"
  ! findmnt -rn -S "${SSD_PARTITION}" >/dev/null || fail "desmonta ${SSD_PARTITION} antes de formatear"
  mkfs.ext4 -F -L honeytrace-data "${SSD_PARTITION}"
fi

FSTYPE="$(blkid -s TYPE -o value "${SSD_PARTITION}" || true)"
[[ "${FSTYPE}" == "ext4" ]] || fail "${SSD_PARTITION} debe ser ext4; usa --format con confirmación si deseas borrarla"
SSD_UUID="$(blkid -s UUID -o value "${SSD_PARTITION}")"
[[ -n "${SSD_UUID}" ]] || fail "no se pudo obtener el UUID del SSD"

install -d -m 0750 "${MOUNT_POINT}"
cp --preserve=mode,ownership,timestamps /etc/fstab "/etc/fstab.honeytrace.$(date +%Y%m%d%H%M%S).bak"
FSTAB_TMP="$(mktemp)"
awk '
  $0 == "# BEGIN HONEYTRACE SSD" { skip=1; next }
  $0 == "# END HONEYTRACE SSD" { skip=0; next }
  !skip { print }
' /etc/fstab >"${FSTAB_TMP}"
printf '\n# BEGIN HONEYTRACE SSD\nUUID=%s %s ext4 defaults,noatime,nofail,x-systemd.device-timeout=30 0 2\n# END HONEYTRACE SSD\n' "${SSD_UUID}" "${MOUNT_POINT}" >>"${FSTAB_TMP}"
install -m 0644 "${FSTAB_TMP}" /etc/fstab
rm -f "${FSTAB_TMP}"
systemctl daemon-reload
mount "${MOUNT_POINT}"
mountpoint -q "${MOUNT_POINT}" || fail "el SSD no quedó montado en ${MOUNT_POINT}"

install -d -m 0750 "${MOUNT_POINT}/logs"
install -d -m 0700 -o 999 -g 999 "${MOUNT_POINT}/postgres"
install -d -m 0700 "${MOUNT_POINT}/engine"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl e2fsprogs
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  CODENAME="${DEBIAN_CODENAME:-${VERSION_CODENAME:-}}"
  [[ -n "${CODENAME}" ]] || fail "no se pudo detectar la versión Debian base"
  cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: ${CODENAME}
Components: stable
Architectures: ${ARCH}
Signed-By: /etc/apt/keyrings/docker.asc
EOF
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

install -d -m 0750 "${ENV_DIR}"
if [[ "$(readlink -f -- "${INGEST_TOKEN_FILE}")" != "$(readlink -m -- "${TOKEN_FILE}")" ]]; then
  install -m 0400 "${INGEST_TOKEN_FILE}" "${TOKEN_FILE}"
else
  chmod 0400 "${TOKEN_FILE}"
fi
[[ -s "${TOKEN_FILE}" ]] || fail "el token de ingestión está vacío"
if [[ -f "${ENV_FILE}" ]]; then
  DB_PASSWORD="$(sed -n 's/^HONEYPOT_DB_PASSWORD=//p' "${ENV_FILE}" | head -n1)"
fi
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 24)}"
cat >"${ENV_FILE}" <<EOF
COMPOSE_PROJECT_NAME=honeytrace-rpi
HONEYTRACE_DATA_ROOT=${MOUNT_POINT}
HONEYPOT_BIND_ADDRESS=${BIND_ADDRESS}
HONEYPOT_PORT=${HONEYPOT_PORT}
HONEYPOT_DB_PASSWORD=${DB_PASSWORD}
HONEYTRACE_LOG_MAX_BYTES=5242880
HONEYTRACE_LOG_BACKUPS=2
HONEYTRACE_API_URL=${API_URL}
HONEYTRACE_SOURCE_ID=${SOURCE_ID}
HONEYTRACE_INGEST_TOKEN_FILE=${TOKEN_FILE}
HONEYTRACE_POLL_SECONDS=2
HONEYTRACE_SETTLE_SECONDS=3
EOF
chmod 0600 "${ENV_FILE}"

cat >"${SERVICE_FILE}" <<EOF
[Unit]
Description=HoneyTrace honeypot for Raspberry Pi
Documentation=file://${REPO_ROOT}/scripts/raspberry-pi/README.md
Wants=network-online.target
After=network-online.target docker.service
Requires=docker.service
RequiresMountsFor=${MOUNT_POINT}
ConditionPathIsMountPoint=${MOUNT_POINT}

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${REPO_ROOT}
Environment=DOCKER_BUILDKIT=1
ExecStart=/usr/bin/docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE} up -d --build --remove-orphans
ExecStartPost=${SCRIPT_DIR}/healthcheck.sh ${ENV_FILE} ${COMPOSE_FILE}
ExecStop=/usr/bin/docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE} down
TimeoutStartSec=1200
TimeoutStopSec=120

[Install]
WantedBy=multi-user.target
EOF

chmod +x "${SCRIPT_DIR}/healthcheck.sh"
systemctl daemon-reload
systemctl enable honeytrace-rpi.service
systemctl restart honeytrace-rpi.service
"${SCRIPT_DIR}/healthcheck.sh" "${ENV_FILE}" "${COMPOSE_FILE}"

printf '\nHoneyTrace quedó instalado.\n'
printf 'SSD: %s (UUID=%s) en %s\n' "${SSD_PARTITION}" "${SSD_UUID}" "${MOUNT_POINT}"
printf 'Honeypot: http://%s:%s\n' "${BIND_ADDRESS}" "${HONEYPOT_PORT}"
printf 'Visualizador API: %s (fuente: %s)\n' "${API_URL}" "${SOURCE_ID}"
printf 'Estado: sudo systemctl status honeytrace-rpi\n'
printf 'Logs: sudo journalctl -u honeytrace-rpi -f\n'

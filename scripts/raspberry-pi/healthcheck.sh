#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${1:-/etc/honeytrace/raspberry.env}"
COMPOSE_FILE="${2:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/docker-compose.yml}"
[[ -r "${ENV_FILE}" ]] || { echo "No se puede leer ${ENV_FILE}" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a

mountpoint -q "${HONEYTRACE_DATA_ROOT}" || { echo "SSD no montado" >&2; exit 1; }
for attempt in $(seq 1 60); do
  if curl --fail --silent --show-error --max-time 3 "http://${HONEYPOT_BIND_ADDRESS}:${HONEYPOT_PORT}/health" >/dev/null; then
    break
  fi
  ((attempt < 60)) || { docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" logs --tail 80 >&2; exit 1; }
  sleep 2
done

AVAILABLE_KB="$(awk '/MemAvailable:/ { print $2 }' /proc/meminfo)"
FREE_BYTES="$(df -B1 --output=avail "${HONEYTRACE_DATA_ROOT}" | tail -n1 | tr -d ' ')"
TEMPERATURE="unavailable"
if [[ -r /sys/class/thermal/thermal_zone0/temp ]]; then
  TEMPERATURE="$(awk '{ printf "%.1fC", $1/1000 }' /sys/class/thermal/thermal_zone0/temp)"
fi

printf 'HoneyTrace OK | memoria_disponible=%sMiB | ssd_libre=%sMiB | temperatura=%s\n' \
  "$((AVAILABLE_KB / 1024))" "$((FREE_BYTES / 1024 / 1024))" "${TEMPERATURE}"


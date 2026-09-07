from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
INSTALLER = ROOT / "scripts" / "raspberry-pi" / "install.sh"
COMPOSE = ROOT / "scripts" / "raspberry-pi" / "docker-compose.yml"


def test_installer_requires_explicit_partition_and_erase_confirmation() -> None:
    script = INSTALLER.read_text(encoding="utf-8")
    assert "--ssd-partition" in script
    assert '[[ "${CONFIRM_ERASE}" == "${SSD_PARTITION}" ]]' in script
    assert '[[ "$(lsblk -ndo TYPE "${SSD_PARTITION}")" == "part" ]]' in script
    assert '[[ "${ROOT_DISK}" != "${SSD_DISK}" ]]' in script


def test_installer_mounts_by_uuid_and_registers_systemd() -> None:
    script = INSTALLER.read_text(encoding="utf-8")
    assert "UUID=%s" in script
    assert "RequiresMountsFor=${MOUNT_POINT}" in script
    assert "systemctl enable honeytrace-rpi.service" in script
    assert "systemctl restart honeytrace-rpi.service" in script


def test_pi_compose_is_resource_limited_and_uses_ssd() -> None:
    compose = COMPOSE.read_text(encoding="utf-8")
    assert "mem_limit: 448m" in compose
    assert "mem_limit: 384m" in compose
    assert "internal: true" in compose
    assert "HONEYTRACE_DATA_ROOT" in compose
    assert "restart: unless-stopped" in compose

from pathlib import Path

import pytest

from app.services.decoy_files import resolve_decoy_path


def test_path_traversal_can_reach_only_decoy_root(tmp_path: Path) -> None:
    public = tmp_path / "public"
    secret = tmp_path / "secrets" / "system.txt"
    public.mkdir()
    secret.parent.mkdir()
    secret.write_text("synthetic", encoding="utf-8")

    assert resolve_decoy_path(tmp_path, "../secrets/system.txt") == secret.resolve()


def test_path_traversal_cannot_escape_decoy_root(tmp_path: Path) -> None:
    (tmp_path / "public").mkdir()

    with pytest.raises(PermissionError):
        resolve_decoy_path(tmp_path, "../../../../Windows/System32/drivers/etc/hosts")

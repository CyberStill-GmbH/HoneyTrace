from pathlib import Path


def resolve_decoy_path(decoy_root: Path, user_path: str) -> Path:
    root = decoy_root.resolve()
    requested = (root / "public" / user_path).resolve()
    if not requested.is_relative_to(root):
        raise PermissionError("path escapes the decoy filesystem")
    return requested

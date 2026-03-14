from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path

from app.schemas.checks import CheckCategory

ALLOWED_NPM_SCRIPTS: tuple[tuple[str, CheckCategory, str], ...] = (
    ("typecheck", "typecheck", "TypeScript Typecheck"),
    ("lint", "lint", "Lint"),
    ("test", "test", "Test"),
)


@dataclass(slots=True)
class ResolvedCheckProfile:
    id: str
    name: str
    category: CheckCategory
    working_dir: Path
    command: list[str]
    command_preview: str


class CheckProfileDiscovery:
    def discover(self, root: Path) -> list[ResolvedCheckProfile]:
        candidate_dirs = [root]
        for child_name in ("backend", "frontend"):
            child_path = root / child_name
            if child_path.is_dir():
                candidate_dirs.append(child_path)

        profiles: list[ResolvedCheckProfile] = []
        seen_ids: set[str] = set()
        for directory in candidate_dirs:
            for profile in self._discover_python_profiles(root, directory):
                if profile.id not in seen_ids:
                    seen_ids.add(profile.id)
                    profiles.append(profile)
            for profile in self._discover_npm_profiles(root, directory):
                if profile.id not in seen_ids:
                    seen_ids.add(profile.id)
                    profiles.append(profile)

        return profiles

    def _discover_python_profiles(self, root: Path, directory: Path) -> list[ResolvedCheckProfile]:
        if not self._has_python_test_markers(directory):
            return []

        profile_id = self._profile_id(root, directory, suffix="pytest")
        return [
            ResolvedCheckProfile(
                id=profile_id,
                name=f"Pytest ({self._display_dir(root, directory)})",
                category="test",
                working_dir=directory,
                command=[sys.executable, "-m", "pytest", "tests"],
                command_preview=f"{Path(sys.executable).name} -m pytest tests",
            )
        ]

    def _discover_npm_profiles(self, root: Path, directory: Path) -> list[ResolvedCheckProfile]:
        package_json = directory / "package.json"
        if not package_json.is_file():
            return []

        try:
            payload = json.loads(package_json.read_text(encoding="utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return []

        scripts = payload.get("scripts")
        if not isinstance(scripts, dict):
            return []

        profiles: list[ResolvedCheckProfile] = []
        for script_name, category, title in ALLOWED_NPM_SCRIPTS:
            if script_name not in scripts:
                continue
            profile_id = self._profile_id(root, directory, suffix=f"npm-{script_name}")
            profiles.append(
                ResolvedCheckProfile(
                    id=profile_id,
                    name=f"{title} ({self._display_dir(root, directory)})",
                    category=category,
                    working_dir=directory,
                    command=["npm", "run", script_name],
                    command_preview=f"npm run {script_name}",
                )
            )

        return profiles

    def _has_python_test_markers(self, directory: Path) -> bool:
        return (
            (directory / "tests").is_dir()
            or (directory / "pytest.ini").is_file()
            or (directory / "pyproject.toml").is_file()
        )

    def _profile_id(self, root: Path, directory: Path, *, suffix: str) -> str:
        directory_token = self._display_dir(root, directory).replace("/", "_")
        return f"{directory_token}_{suffix}"

    def _display_dir(self, root: Path, directory: Path) -> str:
        if directory == root:
            return "root"
        return directory.relative_to(root).as_posix()

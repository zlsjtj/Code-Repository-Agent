from __future__ import annotations

import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from time import perf_counter

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.schemas.checks import (
    CheckCategory,
    CheckExecutionResult,
    CheckProfileListResponse,
    CheckProfileRead,
    CheckRecommendationItem,
    CheckRecommendationRequest,
    CheckRecommendationResponse,
    CheckRunRequest,
    CheckRunResponse,
)
from app.services.repository_service import RepositoryService, RepositoryValidationError

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


class CheckService:
    def __init__(self, db: Session):
        self.db = db
        self.repository_service = RepositoryService(db)

    def list_profiles(self, repo_id: int) -> CheckProfileListResponse:
        repository = self.repository_service.get_repository(repo_id)
        profiles = self._discover_profiles(repository.id)
        return CheckProfileListResponse(
            repo_id=repo_id,
            items=[
                CheckProfileRead(
                    id=profile.id,
                    name=profile.name,
                    category=profile.category,
                    working_dir=profile.working_dir.as_posix(),
                    command_preview=profile.command_preview,
                )
                for profile in profiles
            ],
        )

    def run_checks(self, payload: CheckRunRequest) -> CheckRunResponse:
        repository = self.repository_service.get_repository(payload.repo_id)
        profiles = self._discover_profiles(repository.id)
        if not profiles:
            return CheckRunResponse(
                repo_id=payload.repo_id,
                status="skipped",
                summary="No safe lint/test profiles were discovered for this repository yet.",
                results=[],
            )

        if payload.profile_ids:
            profile_map = {profile.id: profile for profile in profiles}
            missing = [profile_id for profile_id in payload.profile_ids if profile_id not in profile_map]
            if missing:
                raise RepositoryValidationError(
                    f"Unknown check profile ids: {', '.join(sorted(missing))}."
                )
            selected_profiles = [profile_map[profile_id] for profile_id in payload.profile_ids]
        else:
            selected_profiles = profiles

        results = [self._run_profile(profile) for profile in selected_profiles]
        if not results:
            status = "skipped"
            summary = "No check profiles were selected to run."
        elif any(result.status in {"failed", "error"} for result in results):
            status = "failed"
            summary = f"Completed {len(results)} checks with at least one failing result."
        else:
            status = "passed"
            summary = f"Completed {len(results)} checks successfully."

        return CheckRunResponse(
            repo_id=payload.repo_id,
            status=status,
            summary=summary,
            results=results,
        )

    def recommend_profiles(self, payload: CheckRecommendationRequest) -> CheckRecommendationResponse:
        repository = self.repository_service.get_repository(payload.repo_id)
        profiles = self._discover_profiles(repository.id)
        normalized_paths = [self._normalize_repo_path(path) for path in payload.changed_paths if path.strip()]

        if not profiles:
            return CheckRecommendationResponse(
                repo_id=payload.repo_id,
                changed_paths=normalized_paths,
                strategy="none",
                summary="No safe check profiles were discovered for this repository yet.",
                items=[],
            )

        if not normalized_paths:
            return CheckRecommendationResponse(
                repo_id=payload.repo_id,
                changed_paths=[],
                strategy="fallback_all",
                summary="No changed paths were provided, so all discovered checks are recommended.",
                items=[
                    CheckRecommendationItem(
                        id=profile.id,
                        name=profile.name,
                        category=profile.category,
                        working_dir=profile.working_dir.as_posix(),
                        command_preview=profile.command_preview,
                        reason="No changed paths were provided.",
                        score=0,
                    )
                    for profile in profiles
                ],
            )

        root = self.repository_service.resolve_local_root(repository)
        scored: list[tuple[int, ResolvedCheckProfile, str]] = []
        for profile in profiles:
            score, reason = self._score_profile(profile, normalized_paths, root=root)
            if score > 0:
                scored.append((score, profile, reason))

        if not scored:
            return CheckRecommendationResponse(
                repo_id=payload.repo_id,
                changed_paths=normalized_paths,
                strategy="fallback_all",
                summary="No path-specific match was found, so all discovered checks are recommended.",
                items=[
                    CheckRecommendationItem(
                        id=profile.id,
                        name=profile.name,
                        category=profile.category,
                        working_dir=profile.working_dir.as_posix(),
                        command_preview=profile.command_preview,
                        reason="No path-specific match was found.",
                        score=0,
                    )
                    for profile in profiles
                ],
            )

        scored.sort(key=lambda entry: (-entry[0], entry[1].id))
        items = [
            CheckRecommendationItem(
                id=profile.id,
                name=profile.name,
                category=profile.category,
                working_dir=profile.working_dir.as_posix(),
                command_preview=profile.command_preview,
                reason=reason,
                score=score,
            )
            for score, profile, reason in scored
        ]
        return CheckRecommendationResponse(
            repo_id=payload.repo_id,
            changed_paths=normalized_paths,
            strategy="matched",
            summary=f"Recommended {len(items)} checks based on {len(normalized_paths)} changed path(s).",
            items=items,
        )

    def _discover_profiles(self, repo_id: int) -> list[ResolvedCheckProfile]:
        repository = self.repository_service.get_repository(repo_id)
        root = self.repository_service.resolve_repository_root(repository)
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

    def _run_profile(self, profile: ResolvedCheckProfile) -> CheckExecutionResult:
        settings = get_settings()
        started_at = perf_counter()
        try:
            completed = subprocess.run(
                profile.command,
                cwd=profile.working_dir,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=settings.check_command_timeout_seconds,
            )
            duration_ms = int((perf_counter() - started_at) * 1000)
            stdout, stdout_truncated = self._truncate_output(completed.stdout)
            stderr, stderr_truncated = self._truncate_output(completed.stderr)
            return CheckExecutionResult(
                id=profile.id,
                name=profile.name,
                category=profile.category,
                working_dir=profile.working_dir.as_posix(),
                command_preview=profile.command_preview,
                status="passed" if completed.returncode == 0 else "failed",
                exit_code=completed.returncode,
                duration_ms=duration_ms,
                stdout=stdout,
                stderr=stderr,
                truncated=stdout_truncated or stderr_truncated,
            )
        except subprocess.TimeoutExpired as exc:
            duration_ms = int((perf_counter() - started_at) * 1000)
            stdout, stdout_truncated = self._truncate_output((exc.stdout or ""))
            stderr, stderr_truncated = self._truncate_output((exc.stderr or ""))
            timeout_message = (
                f"Command timed out after {settings.check_command_timeout_seconds} seconds."
            )
            stderr = f"{stderr}\n{timeout_message}".strip()
            return CheckExecutionResult(
                id=profile.id,
                name=profile.name,
                category=profile.category,
                working_dir=profile.working_dir.as_posix(),
                command_preview=profile.command_preview,
                status="error",
                exit_code=None,
                duration_ms=duration_ms,
                stdout=stdout,
                stderr=stderr,
                truncated=stdout_truncated or stderr_truncated,
            )
        except OSError as exc:
            duration_ms = int((perf_counter() - started_at) * 1000)
            return CheckExecutionResult(
                id=profile.id,
                name=profile.name,
                category=profile.category,
                working_dir=profile.working_dir.as_posix(),
                command_preview=profile.command_preview,
                status="error",
                exit_code=None,
                duration_ms=duration_ms,
                stdout="",
                stderr=str(exc),
                truncated=False,
            )

    def _truncate_output(self, value: str) -> tuple[str, bool]:
        limit = get_settings().check_output_char_limit
        if len(value) <= limit:
            return value, False
        return value[:limit] + "\n...[truncated]", True

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

    def _normalize_repo_path(self, value: str) -> str:
        return value.strip().strip("/").replace("\\", "/")

    def _score_profile(
        self,
        profile: ResolvedCheckProfile,
        changed_paths: list[str],
        *,
        root: Path,
    ) -> tuple[int, str]:
        profile_scope = self._display_dir(root, profile.working_dir)
        score = 0
        reasons: list[str] = []

        for changed_path in changed_paths:
            suffix = Path(changed_path).suffix.lower()
            is_python_change = suffix == ".py"
            is_frontend_change = suffix in {".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".mjs", ".cjs"}

            if profile_scope != "root" and (
                changed_path == profile_scope or changed_path.startswith(f"{profile_scope}/")
            ):
                score += 6
                reasons.append(f"`{changed_path}` is inside `{profile_scope}/`.")
            elif profile_scope == "root" and "/" not in changed_path:
                score += 2
                reasons.append(f"`{changed_path}` is at the repository root.")

            if profile.id.endswith("pytest") and is_python_change:
                score += 3
                reasons.append("Python file changes should run pytest.")

            if "npm-" in profile.id and is_frontend_change:
                score += 3
                reasons.append("Frontend file changes should run npm checks.")
                if profile.category == "typecheck" and suffix in {".ts", ".tsx"}:
                    score += 1
                    reasons.append("TypeScript file changes should run typecheck.")

        if not reasons:
            return 0, ""

        deduped_reasons: list[str] = []
        for reason in reasons:
            if reason not in deduped_reasons:
                deduped_reasons.append(reason)

        return score, " ".join(deduped_reasons[:2])

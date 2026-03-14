from __future__ import annotations

import logging
import subprocess
from pathlib import Path
from time import perf_counter

from sqlalchemy.orm import Session

from app.checks.discovery import CheckProfileDiscovery, ResolvedCheckProfile
from app.checks.recommendation import PathBasedCheckRecommendation
from app.core.config import get_settings
from app.schemas.checks import (
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

logger = logging.getLogger(__name__)


class CheckService:
    def __init__(self, db: Session):
        self.db = db
        self.repository_service = RepositoryService(db)
        self.discovery = CheckProfileDiscovery()
        self.recommender = PathBasedCheckRecommendation()

    def list_profiles(self, repo_id: int) -> CheckProfileListResponse:
        repository = self.repository_service.get_repository(repo_id)
        root = self.repository_service.resolve_repository_root(repository)
        profiles = self.discovery.discover(root)
        return CheckProfileListResponse(
            repo_id=repo_id,
            items=[self._to_profile_read(profile) for profile in profiles],
        )

    def run_checks(self, payload: CheckRunRequest) -> CheckRunResponse:
        repository = self.repository_service.get_repository(payload.repo_id)
        root = self.repository_service.resolve_repository_root(repository)
        profiles = self.discovery.discover(root)
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

        logger.info(
            "checks.run.start repo_id=%s profile_ids=%s",
            payload.repo_id,
            [profile.id for profile in selected_profiles],
        )
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

        response = CheckRunResponse(
            repo_id=payload.repo_id,
            status=status,
            summary=summary,
            results=results,
        )
        logger.info(
            "checks.run.complete repo_id=%s status=%s result_count=%s",
            payload.repo_id,
            response.status,
            len(response.results),
        )
        return response

    def recommend_profiles(self, payload: CheckRecommendationRequest) -> CheckRecommendationResponse:
        repository = self.repository_service.get_repository(payload.repo_id)
        root = self.repository_service.resolve_repository_root(repository)
        profiles = self.discovery.discover(root)
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
                        **self._to_profile_read(profile).model_dump(),
                        reason="No changed paths were provided.",
                        score=0,
                    )
                    for profile in profiles
                ],
            )

        scored: list[tuple[int, ResolvedCheckProfile, str]] = []
        for profile in profiles:
            score, reason = self.recommender.score(profile, normalized_paths, root=root)
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
                        **self._to_profile_read(profile).model_dump(),
                        reason="No path-specific match was found.",
                        score=0,
                    )
                    for profile in profiles
                ],
            )

        scored.sort(key=lambda entry: (-entry[0], entry[1].id))
        items = [
            CheckRecommendationItem(
                **self._to_profile_read(profile).model_dump(),
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

    def _to_profile_read(self, profile: ResolvedCheckProfile) -> CheckProfileRead:
        return CheckProfileRead(
            id=profile.id,
            name=profile.name,
            category=profile.category,
            working_dir=profile.working_dir.as_posix(),
            command_preview=profile.command_preview,
        )

    def _truncate_output(self, value: str) -> tuple[str, bool]:
        limit = get_settings().check_output_char_limit
        if len(value) <= limit:
            return value, False
        return value[:limit] + "\n...[truncated]", True

    def _normalize_repo_path(self, value: str) -> str:
        return value.strip().strip("/").replace("\\", "/")

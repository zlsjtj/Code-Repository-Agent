import os
import re
import shutil
import subprocess
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.repository import Repository
from app.schemas.repository import RepositoryCreate

CLONE_NAME_SANITIZER = re.compile(r"[^A-Za-z0-9._-]+")


class RepositoryValidationError(ValueError):
    """Raised when a repository import request fails validation."""


class RepositoryService:
    def __init__(self, db: Session):
        self.db = db

    def list_repositories(self) -> list[Repository]:
        query = select(Repository).order_by(Repository.created_at.desc())
        return list(self.db.scalars(query).all())

    def get_repository(self, repo_id: int) -> Repository:
        repository = self.db.get(Repository, repo_id)
        if repository is None:
            raise LookupError(f"Repository {repo_id} was not found.")
        return repository

    def resolve_repository_root(self, repository: Repository) -> Path:
        if not repository.root_path:
            raise RepositoryValidationError(
                "This repository does not have an available checked-out root_path yet."
            )

        root = Path(repository.root_path).expanduser().resolve()
        if not root.exists() or not root.is_dir():
            raise RepositoryValidationError("The repository root_path is missing or is no longer a directory.")
        return root

    def resolve_local_root(self, repository: Repository) -> Path:
        return self.resolve_repository_root(repository)

    def resolve_relative_path(self, repository: Repository, relative_path: str) -> Path:
        root = self.resolve_repository_root(repository)
        normalized = relative_path.strip().strip("/")
        if not normalized:
            raise RepositoryValidationError("A repository-relative path is required.")

        target = (root / normalized).resolve()
        try:
            target.relative_to(root)
        except ValueError as exc:
            raise RepositoryValidationError("The requested path must stay inside the repository root.") from exc

        if not target.exists():
            raise RepositoryValidationError("The requested repository path does not exist.")
        return target

    def create_repository(self, payload: RepositoryCreate) -> Repository:
        root_path: str | None = None
        source_url = str(payload.source_url) if payload.source_url else None
        name = payload.name.strip() if payload.name else None
        clone_target: Path | None = None

        if payload.source_type == "local":
            candidate = Path(payload.root_path or "").expanduser().resolve()
            if not candidate.exists() or not candidate.is_dir():
                raise RepositoryValidationError("The provided local repository path does not exist or is not a directory.")
            root_path = str(candidate)
            derived_name = candidate.name
        else:
            derived_name = self._derive_repository_name(source_url)

        repository = Repository(
            name=name or derived_name,
            source_type=payload.source_type,
            source_url=source_url,
            root_path=root_path,
            default_branch=payload.default_branch,
            primary_language=None,
            status="pending",
        )
        self.db.add(repository)
        self.db.flush()

        try:
            if payload.source_type == "github":
                clone_target = self._build_clone_target_dir(repository.id, name or derived_name)
                resolved_branch = self._clone_github_repository(
                    source_url=source_url or "",
                    target_dir=clone_target,
                    default_branch=payload.default_branch,
                )
                repository.root_path = str(clone_target.resolve())
                repository.default_branch = resolved_branch or payload.default_branch

            self.db.commit()
            self.db.refresh(repository)
        except Exception:
            self.db.rollback()
            if clone_target:
                shutil.rmtree(clone_target, ignore_errors=True)
            raise
        return repository

    def _derive_repository_name(self, source_url: str | None) -> str:
        if not source_url:
            return "github-repository"

        last_segment = source_url.rstrip("/").split("/")[-1]
        if last_segment.endswith(".git"):
            last_segment = last_segment[:-4]
        return last_segment or "github-repository"

    def _build_clone_target_dir(self, repo_id: int, repository_name: str) -> Path:
        settings = get_settings()
        normalized_name = CLONE_NAME_SANITIZER.sub("-", repository_name.strip().lower()).strip("-")
        if not normalized_name:
            normalized_name = "github-repository"
        normalized_name = normalized_name[:48]
        return settings.resolved_repos_dir / f"{repo_id}-{normalized_name}"

    def _clone_github_repository(
        self,
        *,
        source_url: str,
        target_dir: Path,
        default_branch: str | None,
    ) -> str | None:
        settings = get_settings()
        git_executable = shutil.which("git")
        if not git_executable:
            raise RepositoryValidationError("Git is not available on the server, so GitHub repositories cannot be cloned.")

        clone_command = [
            git_executable,
            "clone",
            "--depth",
            str(max(1, settings.git_clone_depth)),
        ]
        if default_branch:
            clone_command.extend(["--branch", default_branch])
        clone_command.extend([source_url, target_dir.as_posix()])

        env = {
            **os.environ,
            "GIT_TERMINAL_PROMPT": "0",
        }

        try:
            completed = subprocess.run(
                clone_command,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=settings.git_clone_timeout_seconds,
                env=env,
            )
        except subprocess.TimeoutExpired as exc:
            shutil.rmtree(target_dir, ignore_errors=True)
            raise RepositoryValidationError(
                f"Git clone timed out after {settings.git_clone_timeout_seconds} seconds for {source_url}."
            ) from exc
        except OSError as exc:
            shutil.rmtree(target_dir, ignore_errors=True)
            raise RepositoryValidationError(f"Failed to start git clone: {exc}") from exc

        if completed.returncode != 0:
            shutil.rmtree(target_dir, ignore_errors=True)
            stderr = (completed.stderr or completed.stdout or "").strip()
            stderr = stderr[:400] if stderr else "Unknown git clone error."
            raise RepositoryValidationError(f"Failed to clone repository: {stderr}")

        return self._detect_checked_out_branch(target_dir)

    def _detect_checked_out_branch(self, target_dir: Path) -> str | None:
        git_executable = shutil.which("git")
        if not git_executable:
            return None

        try:
            completed = subprocess.run(
                [git_executable, "-C", target_dir.as_posix(), "branch", "--show-current"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=20,
            )
        except (subprocess.TimeoutExpired, OSError):
            return None

        branch_name = completed.stdout.strip()
        return branch_name or None

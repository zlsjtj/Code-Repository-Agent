import os
import re
import shutil
import subprocess
import logging
from pathlib import Path
from urllib.parse import urlparse, urlunparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.repository import Repository
from app.schemas.common import ResponseLanguage
from app.schemas.repository import RepositoryCreate

CLONE_NAME_SANITIZER = re.compile(r"[^A-Za-z0-9._-]+")
logger = logging.getLogger(__name__)


class RepositoryValidationError(ValueError):
    """Raised when a repository import request fails validation."""


class RepositoryService:
    def __init__(self, db: Session):
        self.db = db

    def list_repositories(self) -> list[Repository]:
        query = select(Repository).order_by(Repository.created_at.desc())
        return list(self.db.scalars(query).all())

    def get_repository(
        self,
        repo_id: int,
        response_language: ResponseLanguage | None = None,
    ) -> Repository:
        repository = self.db.get(Repository, repo_id)
        if repository is None:
            raise LookupError(
                self._localized_message(
                    response_language,
                    f"未找到仓库 #{repo_id}。",
                    f"Repository {repo_id} was not found.",
                )
            )
        return repository

    def resolve_repository_root(
        self,
        repository: Repository,
        response_language: ResponseLanguage | None = None,
    ) -> Path:
        if not repository.root_path:
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "这个仓库目前还没有可用的工作区目录。",
                    "This repository does not have an available checked-out root_path yet.",
                )
            )

        root = Path(repository.root_path).expanduser().resolve()
        if not root.exists() or not root.is_dir():
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "仓库的 root_path 不存在，或已经不再是目录。",
                    "The repository root_path is missing or is no longer a directory.",
                )
            )
        return root

    def resolve_relative_path(
        self,
        repository: Repository,
        relative_path: str,
        response_language: ResponseLanguage | None = None,
    ) -> Path:
        root = self.resolve_repository_root(repository, response_language)
        normalized = relative_path.strip().strip("/")
        if not normalized:
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "请提供仓库内的相对路径。",
                    "A repository-relative path is required.",
                )
            )

        target = (root / normalized).resolve()
        try:
            target.relative_to(root)
        except ValueError as exc:
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "请求的路径必须位于仓库根目录之内。",
                    "The requested path must stay inside the repository root.",
                )
            ) from exc

        if not target.exists():
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "请求的仓库路径不存在。",
                    "The requested repository path does not exist.",
                )
            )
        return target

    def create_repository(
        self,
        payload: RepositoryCreate,
        response_language: ResponseLanguage | None = None,
    ) -> Repository:
        root_path: str | None = None
        source_url = str(payload.source_url) if payload.source_url else None
        name = payload.name.strip() if payload.name else None
        clone_target: Path | None = None

        if payload.source_type == "local":
            candidate = Path(payload.root_path or "").expanduser().resolve()
            if not candidate.exists() or not candidate.is_dir():
                raise RepositoryValidationError(
                    self._localized_message(
                        response_language,
                        "提供的本地仓库路径不存在，或不是目录。",
                        "The provided local repository path does not exist or is not a directory.",
                    )
                )
            root_path = str(candidate)
            derived_name = candidate.name
        else:
            source_url = self._normalize_github_source_url(source_url, response_language)
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
                logger.info(
                    "repository.clone.start repo_id=%s source_url=%s target_dir=%s",
                    repository.id,
                    source_url,
                    clone_target,
                )
                resolved_branch = self._clone_github_repository(
                    source_url=source_url or "",
                    target_dir=clone_target,
                    default_branch=payload.default_branch,
                    response_language=response_language,
                )
                repository.root_path = str(clone_target.resolve())
                repository.default_branch = resolved_branch or payload.default_branch

            self.db.commit()
            self.db.refresh(repository)
            logger.info(
                "repository.create.success repo_id=%s source_type=%s root_path=%s",
                repository.id,
                repository.source_type,
                repository.root_path,
            )
        except Exception:
            self.db.rollback()
            if clone_target:
                shutil.rmtree(clone_target, ignore_errors=True)
            logger.exception(
                "repository.create.failed source_type=%s source_url=%s root_path=%s",
                payload.source_type,
                source_url,
                root_path,
            )
            raise
        return repository

    def create_pending_github_repository(
        self,
        payload: RepositoryCreate,
        response_language: ResponseLanguage | None = None,
    ) -> Repository:
        if payload.source_type != "github":
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "鍙湁 GitHub 浠撳簱鏀寔鍚庡彴鍏嬮殕浠诲姟銆?",
                    "Only GitHub repositories support background clone jobs.",
                )
            )

        source_url = self._normalize_github_source_url(
            str(payload.source_url) if payload.source_url else None,
            response_language,
        )
        derived_name = self._derive_repository_name(source_url)
        repository = Repository(
            name=payload.name.strip() if payload.name else derived_name,
            source_type=payload.source_type,
            source_url=source_url,
            root_path=None,
            default_branch=payload.default_branch,
            primary_language=None,
            status="pending",
        )
        self.db.add(repository)
        self.db.commit()
        self.db.refresh(repository)
        logger.info(
            "repository.create_pending.success repo_id=%s source_type=%s source_url=%s",
            repository.id,
            repository.source_type,
            repository.source_url,
        )
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
        response_language: ResponseLanguage | None,
    ) -> str | None:
        settings = get_settings()
        git_executable = shutil.which("git")
        if not git_executable:
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "当前环境没有可用的 git，因此无法克隆 GitHub 仓库。",
                    "Git is not available on the server, so GitHub repositories cannot be cloned.",
                )
            )

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
                self._localized_message(
                    response_language,
                    f"克隆仓库超时：{settings.git_clone_timeout_seconds} 秒后仍未完成，目标地址为 {source_url}。",
                    f"Git clone timed out after {settings.git_clone_timeout_seconds} seconds for {source_url}.",
                )
            ) from exc
        except OSError as exc:
            shutil.rmtree(target_dir, ignore_errors=True)
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    f"启动 git clone 失败：{exc}",
                    f"Failed to start git clone: {exc}",
                )
            ) from exc

        if completed.returncode != 0:
            shutil.rmtree(target_dir, ignore_errors=True)
            stderr = (completed.stderr or completed.stdout or "").strip()
            stderr = stderr[:400] if stderr else self._localized_message(
                response_language,
                "未知的 git clone 错误。",
                "Unknown git clone error.",
            )
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    f"克隆仓库失败：{stderr}",
                    f"Failed to clone repository: {stderr}",
                )
            )

        return self._detect_checked_out_branch(target_dir)

    def _normalize_github_source_url(
        self,
        source_url: str | None,
        response_language: ResponseLanguage | None,
    ) -> str:
        if not source_url:
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "当 source_type 为 'github' 时，必须提供 source_url。",
                    "source_url is required when source_type is 'github'.",
                )
            )

        settings = get_settings()
        parsed = urlparse(source_url)
        hostname = (parsed.hostname or "").lower()
        allowed_hosts = {host.lower() for host in settings.allowed_git_hosts}

        if parsed.scheme != "https":
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "GitHub 导入必须使用 https 仓库地址。",
                    "GitHub imports must use an https repository URL.",
                )
            )
        if parsed.username or parsed.password:
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "GitHub 导入不接受在 source_url 中内嵌账号或密码。",
                    "GitHub imports do not accept embedded credentials in source_url.",
                )
            )
        if hostname not in allowed_hosts:
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    f"只允许克隆配置白名单中的 Git 主机：{', '.join(sorted(allowed_hosts))}。",
                    f"Only configured Git hosts are allowed for repository cloning: {', '.join(sorted(allowed_hosts))}.",
                )
            )

        path_segments = [segment for segment in parsed.path.split("/") if segment]
        if len(path_segments) != 2:
            raise RepositoryValidationError(
                self._localized_message(
                    response_language,
                    "GitHub source_url 必须指向仓库根地址，例如 https://github.com/org/repo 。",
                    "GitHub source_url must point to a repository root like https://github.com/org/repo.",
                )
            )

        normalized_path = "/" + "/".join(path_segments)
        return urlunparse(("https", hostname, normalized_path, "", "", ""))

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

    def _localized_message(
        self,
        response_language: ResponseLanguage | None,
        zh_cn_message: str,
        en_message: str,
    ) -> str:
        if response_language == ResponseLanguage.ZH_CN:
            return zh_cn_message
        return en_message

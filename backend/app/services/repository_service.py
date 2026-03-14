from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.schemas.repository import RepositoryCreate


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

    def resolve_local_root(self, repository: Repository) -> Path:
        if repository.source_type != "local" or not repository.root_path:
            raise RepositoryValidationError(
                "Only local repositories with an available root_path can be scanned in this stage."
            )

        root = Path(repository.root_path).expanduser().resolve()
        if not root.exists() or not root.is_dir():
            raise RepositoryValidationError("The repository root_path is missing or is no longer a directory.")
        return root

    def create_repository(self, payload: RepositoryCreate) -> Repository:
        root_path: str | None = None
        source_url = str(payload.source_url) if payload.source_url else None
        name = payload.name.strip() if payload.name else None

        if payload.source_type == "local":
            candidate = Path(payload.root_path or "").expanduser().resolve()
            if not candidate.exists() or not candidate.is_dir():
                raise RepositoryValidationError("The provided local repository path does not exist or is not a directory.")
            root_path = str(candidate)
            derived_name = candidate.name
        else:
            derived_name = (source_url or "github-repository").rstrip("/").split("/")[-1]

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
        self.db.commit()
        self.db.refresh(repository)
        return repository

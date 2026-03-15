from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.language import get_response_language
from app.core.db import get_db
from app.schemas.common import ResponseLanguage
from app.schemas.jobs import JobRunRead
from app.schemas.repository import (
    FileChunkListResponse,
    RepositoryCreate,
    RepositoryImportJobResponse,
    RepositoryIndexResponse,
    RepositoryIndexStatusResponse,
    RepositoryListResponse,
    RepositoryRead,
    RepositoryTreeResponse,
)
from app.services.indexing_service import IndexingService
from app.services.job_service import JobService
from app.services.repository_service import RepositoryService, RepositoryValidationError

router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.get("", response_model=RepositoryListResponse)
def list_repositories(db: Session = Depends(get_db)) -> RepositoryListResponse:
    service = RepositoryService(db)
    repositories = service.list_repositories()
    return RepositoryListResponse(items=repositories)


@router.post("", response_model=RepositoryRead, status_code=status.HTTP_201_CREATED)
def create_repository(
    payload: RepositoryCreate,
    db: Session = Depends(get_db),
    response_language: ResponseLanguage | None = Depends(get_response_language),
) -> RepositoryRead:
    service = RepositoryService(db)
    return service.create_repository(payload, response_language)


@router.post("/import-jobs", response_model=RepositoryImportJobResponse, status_code=status.HTTP_202_ACCEPTED)
def create_repository_import_job(
    payload: RepositoryCreate,
    db: Session = Depends(get_db),
    response_language: ResponseLanguage | None = Depends(get_response_language),
) -> RepositoryImportJobResponse:
    if payload.source_type != "github":
        raise RepositoryValidationError(
            "鍙湁 GitHub 浠撳簱鍙互浣跨敤鍚庡彴瀵煎叆浠诲姟鎺ュ彛銆?"
            if response_language == ResponseLanguage.ZH_CN
            else "Only GitHub repositories can use the background import job endpoint."
        )

    service = JobService(db)
    return service.enqueue_repository_clone_job(payload, response_language)


@router.get("/{repo_id}", response_model=RepositoryRead)
def get_repository(repo_id: int, db: Session = Depends(get_db)) -> RepositoryRead:
    service = RepositoryService(db)
    return service.get_repository(repo_id)


@router.get("/{repo_id}/tree", response_model=RepositoryTreeResponse)
def get_repository_tree(
    repo_id: int,
    path: str = Query(default=""),
    depth: int = Query(default=3, ge=1, le=8),
    db: Session = Depends(get_db),
    response_language: ResponseLanguage | None = Depends(get_response_language),
) -> RepositoryTreeResponse:
    repository_service = RepositoryService(db)
    indexing_service = IndexingService(db)

    repository = repository_service.get_repository(repo_id, response_language)
    root = repository_service.resolve_repository_root(repository, response_language)
    return indexing_service.build_tree(
        repository,
        root=root,
        path=path,
        depth=depth,
        response_language=response_language,
    )


@router.get("/{repo_id}/index-status", response_model=RepositoryIndexStatusResponse)
def get_index_status(repo_id: int, db: Session = Depends(get_db)) -> RepositoryIndexStatusResponse:
    repository_service = RepositoryService(db)
    indexing_service = IndexingService(db)

    repository = repository_service.get_repository(repo_id)
    return indexing_service.get_index_status(repository)


@router.get("/{repo_id}/chunks", response_model=FileChunkListResponse)
def list_repository_chunks(
    repo_id: int,
    path: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
    response_language: ResponseLanguage | None = Depends(get_response_language),
) -> FileChunkListResponse:
    repository_service = RepositoryService(db)
    indexing_service = IndexingService(db)

    repository = repository_service.get_repository(repo_id, response_language)
    return indexing_service.list_chunks(repository, path=path, limit=limit)


@router.post("/{repo_id}/index", response_model=RepositoryIndexResponse)
def request_index(
    repo_id: int,
    db: Session = Depends(get_db),
    response_language: ResponseLanguage | None = Depends(get_response_language),
) -> RepositoryIndexResponse:
    repository_service = RepositoryService(db)
    indexing_service = IndexingService(db)

    repository = repository_service.get_repository(repo_id, response_language)
    return indexing_service.request_index(repository, response_language)


@router.post("/{repo_id}/index-jobs", response_model=JobRunRead, status_code=status.HTTP_202_ACCEPTED)
def create_index_job(
    repo_id: int,
    db: Session = Depends(get_db),
    response_language: ResponseLanguage | None = Depends(get_response_language),
) -> JobRunRead:
    service = JobService(db)
    return service.enqueue_repository_index_job(repo_id, response_language)

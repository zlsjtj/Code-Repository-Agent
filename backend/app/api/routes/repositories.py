from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.repository import (
    FileChunkListResponse,
    RepositoryCreate,
    RepositoryIndexResponse,
    RepositoryIndexStatusResponse,
    RepositoryListResponse,
    RepositoryRead,
    RepositoryTreeResponse,
)
from app.services.indexing_service import IndexingService
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
) -> RepositoryRead:
    service = RepositoryService(db)
    try:
        return service.create_repository(payload)
    except RepositoryValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{repo_id}", response_model=RepositoryRead)
def get_repository(repo_id: int, db: Session = Depends(get_db)) -> RepositoryRead:
    service = RepositoryService(db)
    try:
        return service.get_repository(repo_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/{repo_id}/tree", response_model=RepositoryTreeResponse)
def get_repository_tree(
    repo_id: int,
    path: str = Query(default=""),
    depth: int = Query(default=3, ge=1, le=8),
    db: Session = Depends(get_db),
) -> RepositoryTreeResponse:
    repository_service = RepositoryService(db)
    indexing_service = IndexingService(db)

    try:
        repository = repository_service.get_repository(repo_id)
        root = repository_service.resolve_local_root(repository)
        return indexing_service.build_tree(repository, root=root, path=path, depth=depth)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except (RepositoryValidationError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{repo_id}/index-status", response_model=RepositoryIndexStatusResponse)
def get_index_status(repo_id: int, db: Session = Depends(get_db)) -> RepositoryIndexStatusResponse:
    repository_service = RepositoryService(db)
    indexing_service = IndexingService(db)

    try:
        repository = repository_service.get_repository(repo_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return indexing_service.get_index_status(repository)


@router.get("/{repo_id}/chunks", response_model=FileChunkListResponse)
def list_repository_chunks(
    repo_id: int,
    path: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> FileChunkListResponse:
    repository_service = RepositoryService(db)
    indexing_service = IndexingService(db)

    try:
        repository = repository_service.get_repository(repo_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return indexing_service.list_chunks(repository, path=path, limit=limit)


@router.post("/{repo_id}/index", response_model=RepositoryIndexResponse)
def request_index(repo_id: int, db: Session = Depends(get_db)) -> RepositoryIndexResponse:
    repository_service = RepositoryService(db)
    indexing_service = IndexingService(db)

    try:
        repository = repository_service.get_repository(repo_id)
        return indexing_service.request_index(repository)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except RepositoryValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

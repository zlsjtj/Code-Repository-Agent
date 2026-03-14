from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.repository import (
    RepositoryCreate,
    RepositoryIndexResponse,
    RepositoryListResponse,
    RepositoryRead,
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


@router.post("/{repo_id}/index", response_model=RepositoryIndexResponse, status_code=status.HTTP_202_ACCEPTED)
def request_index(repo_id: int, db: Session = Depends(get_db)) -> RepositoryIndexResponse:
    repository_service = RepositoryService(db)
    indexing_service = IndexingService(db)

    try:
        repository = repository_service.get_repository(repo_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return indexing_service.request_index(repository)


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.checks import (
    CheckProfileListResponse,
    CheckRecommendationRequest,
    CheckRecommendationResponse,
    CheckRunRequest,
    CheckRunResponse,
)
from app.services.checks_service import CheckService
from app.services.repository_service import RepositoryValidationError

router = APIRouter(prefix="/checks", tags=["checks"])


@router.get("/repositories/{repo_id}/profiles", response_model=CheckProfileListResponse)
def list_check_profiles(
    repo_id: int,
    db: Session = Depends(get_db),
) -> CheckProfileListResponse:
    service = CheckService(db)
    try:
        return service.list_profiles(repo_id)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except RepositoryValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/recommend", response_model=CheckRecommendationResponse)
def recommend_checks(
    payload: CheckRecommendationRequest,
    db: Session = Depends(get_db),
) -> CheckRecommendationResponse:
    service = CheckService(db)
    try:
        return service.recommend_profiles(payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except RepositoryValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/run", response_model=CheckRunResponse)
def run_checks(
    payload: CheckRunRequest,
    db: Session = Depends(get_db),
) -> CheckRunResponse:
    service = CheckService(db)
    try:
        return service.run_checks(payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except RepositoryValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

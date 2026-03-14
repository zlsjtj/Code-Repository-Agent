from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.patch import PatchApplyRequest, PatchApplyResponse, PatchDraftRequest, PatchDraftResponse
from app.services.patch_service import PatchConfigurationError, PatchConflictError, PatchService
from app.services.repository_service import RepositoryValidationError

router = APIRouter(prefix="/patches", tags=["patches"])


@router.post("/draft", response_model=PatchDraftResponse)
async def draft_patch(
    payload: PatchDraftRequest,
    db: Session = Depends(get_db),
) -> PatchDraftResponse:
    service = PatchService(db)
    try:
        return await service.draft_patch(payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except (RepositoryValidationError, PatchConfigurationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/apply", response_model=PatchApplyResponse)
def apply_patch(
    payload: PatchApplyRequest,
    db: Session = Depends(get_db),
) -> PatchApplyResponse:
    service = PatchService(db)
    try:
        return service.apply_patch(payload)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PatchConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (RepositoryValidationError, PatchConfigurationError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

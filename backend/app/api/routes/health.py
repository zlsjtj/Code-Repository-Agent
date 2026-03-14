from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.common import HealthResponse, MetaResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        app_name=settings.app_name,
        version=settings.app_version,
    )


@router.get("/meta", response_model=MetaResponse)
def get_meta() -> MetaResponse:
    settings = get_settings()
    return MetaResponse(
        app_name=settings.app_name,
        version=settings.app_version,
        api_prefix=settings.api_prefix,
        features=[
            "repository_import_placeholder",
            "sqlite_schema_bootstrap",
            "frontend_health_probe",
        ],
    )


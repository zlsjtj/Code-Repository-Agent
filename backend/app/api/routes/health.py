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
            "repository_import",
            "repository_tree",
            "basic_chunk_indexing",
            "search_repo",
            "read_file",
            "find_symbol",
            "code_assistant_agent",
            "conversation_trace",
            "frontend_workspace",
            "patch_draft_preview",
            "multi_file_patch_draft",
            "patch_apply",
            "multi_file_patch_apply",
            "checks_runner",
            "apply_and_verify",
            "checks_recommendation",
        ],
    )

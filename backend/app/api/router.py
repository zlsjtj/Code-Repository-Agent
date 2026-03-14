from fastapi import APIRouter

from app.api.routes.chat import router as chat_router
from app.api.routes.health import router as health_router
from app.api.routes.patches import router as patches_router
from app.api.routes.repositories import router as repositories_router
from app.api.routes.tools import router as tools_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(repositories_router)
api_router.include_router(tools_router)
api_router.include_router(chat_router)
api_router.include_router(patches_router)

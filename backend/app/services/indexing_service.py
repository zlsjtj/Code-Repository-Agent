from sqlalchemy.orm import Session

from app.models.repository import Repository
from app.schemas.repository import RepositoryIndexResponse


class IndexingService:
    def __init__(self, db: Session):
        self.db = db

    def request_index(self, repository: Repository) -> RepositoryIndexResponse:
        return RepositoryIndexResponse(
            repo_id=repository.id,
            status=repository.status,
            message="Indexing is reserved for stage 2. The repository record has been created, but no scan has run yet.",
        )


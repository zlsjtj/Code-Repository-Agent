from pathlib import Path

from sqlalchemy import delete, distinct, func, select
from sqlalchemy.orm import Session

from app.indexing.chunker import LineChunker
from app.indexing.scanner import RepositoryScanner
from app.models.file_chunk import FileChunk
from app.models.repository import Repository
from app.schemas.repository import (
    FileChunkListResponse,
    RepositoryIndexResponse,
    RepositoryIndexStatusResponse,
    RepositoryTreeNode,
    RepositoryTreeResponse,
)


class IndexingService:
    def __init__(self, db: Session):
        self.db = db
        self.chunker = LineChunker()
        self.scanner = RepositoryScanner()

    def request_index(self, repository: Repository) -> RepositoryIndexResponse:
        from app.services.repository_service import RepositoryService

        root = RepositoryService(self.db).resolve_local_root(repository)
        repository.status = "indexing"
        self.db.add(repository)
        self.db.commit()
        try:
            scan_result = self.scanner.scan(root)

            self.db.execute(delete(FileChunk).where(FileChunk.repo_id == repository.id))

            chunk_count = 0
            for scanned_file in scan_result.files:
                for chunk in self.chunker.chunk_text(scanned_file.text):
                    self.db.add(
                        FileChunk(
                            repo_id=repository.id,
                            path=scanned_file.relative_path,
                            language=scanned_file.language,
                            chunk_index=chunk.chunk_index,
                            start_line=chunk.start_line,
                            end_line=chunk.end_line,
                            text=chunk.text,
                            hash=chunk.hash_value,
                            symbols_json=None,
                        )
                    )
                    chunk_count += 1

            repository.primary_language = scan_result.primary_language
            repository.status = "ready"
            self.db.add(repository)
            self.db.commit()
            self.db.refresh(repository)
        except Exception:
            self.db.rollback()
            repository.status = "failed"
            self.db.add(repository)
            self.db.commit()
            raise

        return RepositoryIndexResponse(
            repo_id=repository.id,
            status=repository.status,
            message=f"Indexed {scan_result.file_count} files into {chunk_count} chunks.",
            file_count=scan_result.file_count,
            chunk_count=chunk_count,
            skipped_file_count=scan_result.skipped_file_count,
        )

    def get_index_status(self, repository: Repository) -> RepositoryIndexStatusResponse:
        file_count, chunk_count = self._get_chunk_counts(repository.id)
        return RepositoryIndexStatusResponse(
            repo_id=repository.id,
            status=repository.status,
            primary_language=repository.primary_language,
            file_count=file_count,
            chunk_count=chunk_count,
            updated_at=repository.updated_at,
        )

    def list_chunks(
        self,
        repository: Repository,
        *,
        path: str | None = None,
        limit: int = 20,
    ) -> FileChunkListResponse:
        query = select(FileChunk).where(FileChunk.repo_id == repository.id)
        if path:
            query = query.where(FileChunk.path == path)

        query = query.order_by(FileChunk.path.asc(), FileChunk.chunk_index.asc()).limit(limit)
        items = list(self.db.scalars(query).all())
        return FileChunkListResponse(items=items)

    def build_tree(
        self,
        repository: Repository,
        *,
        root: Path,
        path: str = "",
        depth: int = 3,
    ) -> RepositoryTreeResponse:
        relative_path = path.strip().strip("/")
        target = root if not relative_path else (root / relative_path).resolve()
        try:
            target.relative_to(root)
        except ValueError as exc:
            raise ValueError("The requested tree path must stay inside the repository root.") from exc

        if not target.exists() or not target.is_dir():
            raise ValueError("The requested tree path does not exist or is not a directory.")

        nodes = self._build_tree_nodes(target, root=root, depth=depth)
        return RepositoryTreeResponse(
            repo_id=repository.id,
            root_path=str(root),
            path=relative_path,
            depth=depth,
            nodes=nodes,
        )

    def _build_tree_nodes(
        self,
        directory: Path,
        *,
        root: Path,
        depth: int,
    ) -> list[RepositoryTreeNode]:
        nodes: list[RepositoryTreeNode] = []

        for entry in sorted(directory.iterdir(), key=lambda candidate: (candidate.is_file(), candidate.name.lower())):
            if entry.is_dir():
                if self.scanner.should_ignore_directory(entry.name):
                    continue
                children = self._build_tree_nodes(entry, root=root, depth=depth - 1) if depth > 1 else []
                nodes.append(
                    RepositoryTreeNode(
                        name=entry.name,
                        path=entry.relative_to(root).as_posix(),
                        node_type="directory",
                        children=children,
                    )
                )
                continue

            try:
                should_skip = self.scanner.should_skip_file(entry)
            except OSError:
                continue

            if should_skip:
                continue

            nodes.append(
                RepositoryTreeNode(
                    name=entry.name,
                    path=entry.relative_to(root).as_posix(),
                    node_type="file",
                )
            )

        return nodes

    def _get_chunk_counts(self, repo_id: int) -> tuple[int, int]:
        file_count_query = select(func.count(distinct(FileChunk.path))).where(FileChunk.repo_id == repo_id)
        chunk_count_query = select(func.count(FileChunk.id)).where(FileChunk.repo_id == repo_id)
        file_count = int(self.db.scalar(file_count_query) or 0)
        chunk_count = int(self.db.scalar(chunk_count_query) or 0)
        return file_count, chunk_count

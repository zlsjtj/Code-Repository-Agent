from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator
from app.schemas.jobs import JobRunRead

RepositorySourceType = Literal["local", "github"]
RepositoryStatus = Literal["pending", "ready", "indexing", "failed"]


class RepositoryCreate(BaseModel):
    name: str | None = None
    source_type: RepositorySourceType
    root_path: str | None = None
    source_url: HttpUrl | None = None
    default_branch: str | None = None

    @model_validator(mode="after")
    def validate_source_fields(self) -> "RepositoryCreate":
        if self.source_type == "local" and not self.root_path:
            raise ValueError("root_path is required when source_type is 'local'.")
        if self.source_type == "github" and not self.source_url:
            raise ValueError("source_url is required when source_type is 'github'.")
        return self


class RepositoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    source_type: RepositorySourceType
    source_url: str | None
    root_path: str | None
    default_branch: str | None
    primary_language: str | None
    status: RepositoryStatus
    created_at: datetime
    updated_at: datetime


class RepositoryListResponse(BaseModel):
    items: list[RepositoryRead]


class RepositoryImportJobResponse(BaseModel):
    repository: RepositoryRead
    job: JobRunRead


class RepositoryIndexResponse(BaseModel):
    repo_id: int
    status: RepositoryStatus
    message: str
    file_count: int = 0
    chunk_count: int = 0
    skipped_file_count: int = 0


class RepositoryIndexStatusResponse(BaseModel):
    repo_id: int
    status: RepositoryStatus
    primary_language: str | None
    file_count: int
    chunk_count: int
    updated_at: datetime


class RepositoryTreeNode(BaseModel):
    name: str
    path: str
    node_type: Literal["file", "directory"]
    children: list["RepositoryTreeNode"] = Field(default_factory=list)


class RepositoryTreeResponse(BaseModel):
    repo_id: int
    root_path: str
    path: str
    depth: int
    nodes: list[RepositoryTreeNode]


class FileChunkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repo_id: int
    path: str
    language: str | None
    chunk_index: int
    start_line: int
    end_line: int
    text: str
    hash: str | None
    created_at: datetime


class FileChunkListResponse(BaseModel):
    items: list[FileChunkRead]

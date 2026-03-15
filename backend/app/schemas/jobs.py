from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


JobType = Literal["repository_index", "repository_clone"]
JobStatus = Literal["queued", "running", "succeeded", "failed"]


class JobRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repo_id: int
    job_type: JobType
    status: JobStatus
    message: str | None
    file_count: int
    chunk_count: int
    skipped_file_count: int
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
    updated_at: datetime

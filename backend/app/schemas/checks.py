from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

CheckCategory = Literal["lint", "typecheck", "test"]
CheckStatus = Literal["passed", "failed", "error", "skipped"]


class CheckProfileRead(BaseModel):
    id: str
    name: str
    category: CheckCategory
    working_dir: str
    command_preview: str


class CheckProfileListResponse(BaseModel):
    repo_id: int
    items: list[CheckProfileRead]


class CheckRecommendationRequest(BaseModel):
    repo_id: int
    changed_paths: list[str] = Field(default_factory=list)


class CheckRecommendationItem(CheckProfileRead):
    reason: str
    score: int


class CheckRecommendationResponse(BaseModel):
    repo_id: int
    changed_paths: list[str]
    strategy: Literal["matched", "fallback_all", "none"]
    summary: str
    items: list[CheckRecommendationItem]


class CheckRunRequest(BaseModel):
    repo_id: int
    profile_ids: list[str] | None = Field(default=None)


class CheckExecutionResult(BaseModel):
    id: str
    name: str
    category: CheckCategory
    working_dir: str
    command_preview: str
    status: CheckStatus
    exit_code: int | None = None
    duration_ms: int
    stdout: str = ""
    stderr: str = ""
    truncated: bool = False


class CheckRunResponse(BaseModel):
    repo_id: int
    status: CheckStatus
    summary: str
    results: list[CheckExecutionResult]

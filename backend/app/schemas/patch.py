from __future__ import annotations

from pydantic import BaseModel, Field


class PatchDraftRequest(BaseModel):
    repo_id: int
    target_path: str = Field(min_length=1)
    instruction: str = Field(min_length=1)
    session_id: str | None = None


class PatchDraftTraceSummary(BaseModel):
    agent_name: str
    model: str
    latency_ms: int


class PatchDraftResponse(BaseModel):
    session_id: str
    repo_id: int
    target_path: str
    summary: str
    rationale: str
    warnings: list[str] = Field(default_factory=list)
    original_line_count: int
    proposed_line_count: int
    line_count_delta: int
    unified_diff: str
    proposed_content: str
    trace_summary: PatchDraftTraceSummary

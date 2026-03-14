from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.checks import CheckRunResponse


class PatchDraftRequest(BaseModel):
    repo_id: int
    target_path: str = Field(min_length=1)
    instruction: str = Field(min_length=1)
    session_id: str | None = None


class PatchDraftTraceSummary(BaseModel):
    agent_name: str
    model: str
    latency_ms: int


class PatchDraftFile(BaseModel):
    target_path: str
    base_content_sha256: str
    summary: str
    rationale: str
    warnings: list[str] = Field(default_factory=list)
    original_line_count: int
    proposed_line_count: int
    line_count_delta: int
    unified_diff: str
    proposed_content: str
    trace_summary: PatchDraftTraceSummary


class PatchDraftResponse(PatchDraftFile):
    session_id: str
    repo_id: int


class PatchBatchDraftRequest(BaseModel):
    repo_id: int
    target_paths: list[str] = Field(min_length=1)
    instruction: str = Field(min_length=1)
    session_id: str | None = None


class PatchBatchDraftResponse(BaseModel):
    session_id: str
    repo_id: int
    target_paths: list[str]
    summary: str
    warnings: list[str] = Field(default_factory=list)
    changed_file_count: int
    total_original_line_count: int
    total_proposed_line_count: int
    total_line_count_delta: int
    combined_unified_diff: str
    items: list[PatchDraftFile]
    trace_summary: PatchDraftTraceSummary


class PatchApplyFile(BaseModel):
    target_path: str = Field(min_length=1)
    expected_base_sha256: str = Field(min_length=8)
    proposed_content: str


class PatchApplyRequest(PatchApplyFile):
    repo_id: int


class PatchApplyResponse(BaseModel):
    repo_id: int
    target_path: str
    status: Literal["applied", "noop"]
    message: str
    previous_sha256: str
    written_sha256: str
    written_line_count: int
    unified_diff: str


class PatchBatchApplyRequest(BaseModel):
    repo_id: int
    items: list[PatchApplyFile] = Field(min_length=1)


class PatchBatchApplyResponse(BaseModel):
    repo_id: int
    status: Literal["applied", "noop"]
    message: str
    applied_count: int
    noop_count: int
    target_paths: list[str]
    combined_unified_diff: str
    results: list[PatchApplyResponse]


class PatchApplyAndCheckRequest(PatchApplyFile):
    repo_id: int
    profile_ids: list[str] | None = Field(default=None)


class PatchApplyAndCheckResponse(BaseModel):
    patch: PatchApplyResponse
    checks: CheckRunResponse


class PatchBatchApplyAndCheckRequest(BaseModel):
    repo_id: int
    items: list[PatchApplyFile] = Field(min_length=1)
    profile_ids: list[str] | None = Field(default=None)


class PatchBatchApplyAndCheckResponse(BaseModel):
    patch: PatchBatchApplyResponse
    checks: CheckRunResponse

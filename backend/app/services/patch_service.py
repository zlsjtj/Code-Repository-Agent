from __future__ import annotations

import difflib
import hashlib
import os
from pathlib import Path
from time import perf_counter
from uuid import uuid4

from agents import Runner
from sqlalchemy.orm import Session

from app.agents.patch_draft_agent import PatchDraftFinalOutput, build_patch_draft_agent
from app.core.config import get_settings
from app.schemas.patch import (
    PatchApplyRequest,
    PatchApplyResponse,
    PatchDraftRequest,
    PatchDraftResponse,
    PatchDraftTraceSummary,
)
from app.services.repository_service import RepositoryService, RepositoryValidationError

MAX_PATCH_FILE_CHARS = 20_000
MAX_PATCH_FILE_LINES = 500


class PatchConfigurationError(ValueError):
    """Raised when the patch drafting runtime is not configured correctly."""


class PatchConflictError(ValueError):
    """Raised when a patch apply request is stale against the current file content."""


class PatchService:
    def __init__(self, db: Session):
        self.db = db
        self.repository_service = RepositoryService(db)

    async def draft_patch(self, payload: PatchDraftRequest) -> PatchDraftResponse:
        settings = get_settings()
        if not os.getenv("OPENAI_API_KEY"):
            raise PatchConfigurationError(
                "OPENAI_API_KEY is not configured. Set it before calling /api/patches/draft."
            )

        repository = self.repository_service.get_repository(payload.repo_id)
        if repository.source_type != "local":
            raise RepositoryValidationError("Patch drafting is currently available only for local repositories.")

        _, original_content = self._read_target_file(repository.id, payload.target_path)
        session_id = payload.session_id or uuid4().hex
        prompt = self._build_prompt(
            repo_name=repository.name,
            target_path=payload.target_path,
            instruction=payload.instruction,
            original_content=original_content,
        )

        started_at = perf_counter()
        final_output, agent_name = await self._run_agent(prompt=prompt, model=settings.openai_model)
        latency_ms = int((perf_counter() - started_at) * 1000)

        proposed_content = self._normalize_content(final_output.proposed_content)
        original_line_count = self._count_lines(original_content)
        proposed_line_count = self._count_lines(proposed_content)
        unified_diff = self._build_unified_diff(
            target_path=payload.target_path,
            original_content=original_content,
            proposed_content=proposed_content,
        )

        warnings = list(final_output.warnings)
        if not unified_diff:
            warnings.append("The draft did not introduce a textual diff. Refine the instruction if you expected a code change.")

        return PatchDraftResponse(
            session_id=session_id,
            repo_id=payload.repo_id,
            target_path=payload.target_path.strip().strip("/"),
            base_content_sha256=self._hash_content(original_content),
            summary=final_output.summary,
            rationale=final_output.rationale,
            warnings=warnings,
            original_line_count=original_line_count,
            proposed_line_count=proposed_line_count,
            line_count_delta=proposed_line_count - original_line_count,
            unified_diff=unified_diff,
            proposed_content=proposed_content,
            trace_summary=PatchDraftTraceSummary(
                agent_name=agent_name,
                model=settings.openai_model,
                latency_ms=latency_ms,
            ),
        )

    def apply_patch(self, payload: PatchApplyRequest) -> PatchApplyResponse:
        repository = self.repository_service.get_repository(payload.repo_id)
        if repository.source_type != "local":
            raise RepositoryValidationError("Patch apply is currently available only for local repositories.")

        file_path, current_content = self._read_target_file(payload.repo_id, payload.target_path)
        current_hash = self._hash_content(current_content)
        if current_hash != payload.expected_base_sha256:
            raise PatchConflictError(
                "The target file changed since this draft was generated. Re-generate the patch draft before applying."
            )

        proposed_content = self._normalize_content(payload.proposed_content)
        target_path = payload.target_path.strip().strip("/")
        diff = self._build_unified_diff(
            target_path=target_path,
            original_content=current_content,
            proposed_content=proposed_content,
        )

        if not diff:
            return PatchApplyResponse(
                repo_id=payload.repo_id,
                target_path=target_path,
                status="noop",
                message="The proposed content already matches the current file. Nothing was written.",
                previous_sha256=current_hash,
                written_sha256=current_hash,
                written_line_count=self._count_lines(current_content),
                unified_diff=diff,
            )

        file_path.write_text(proposed_content, encoding="utf-8")
        written_hash = self._hash_content(proposed_content)
        return PatchApplyResponse(
            repo_id=payload.repo_id,
            target_path=target_path,
            status="applied",
            message="The patch draft was written to the working tree successfully.",
            previous_sha256=current_hash,
            written_sha256=written_hash,
            written_line_count=self._count_lines(proposed_content),
            unified_diff=diff,
        )

    async def _run_agent(self, *, prompt: str, model: str) -> tuple[PatchDraftFinalOutput, str]:
        agent = build_patch_draft_agent(model)
        result = await Runner.run(agent, prompt)
        final_output = result.final_output
        if not isinstance(final_output, PatchDraftFinalOutput):
            raise PatchConfigurationError("The patch draft assistant returned an unexpected output type.")

        agent_name = getattr(getattr(result, "last_agent", None), "name", agent.name)
        return final_output, agent_name

    def _read_target_file(self, repo_id: int, target_path: str) -> tuple[Path, str]:
        repository = self.repository_service.get_repository(repo_id)
        file_path = self.repository_service.resolve_relative_path(repository, target_path)
        if not file_path.is_file():
            raise RepositoryValidationError("The target_path must point to a file inside the repository.")

        try:
            content = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError as exc:
            raise RepositoryValidationError("Patch drafting currently supports UTF-8 text files only.") from exc

        line_count = self._count_lines(content)
        if len(content) > MAX_PATCH_FILE_CHARS:
            raise RepositoryValidationError(
                f"The target file is too large for a patch draft preview. Keep it under {MAX_PATCH_FILE_CHARS} characters."
            )
        if line_count > MAX_PATCH_FILE_LINES:
            raise RepositoryValidationError(
                f"The target file is too large for a patch draft preview. Keep it under {MAX_PATCH_FILE_LINES} lines."
            )

        return file_path, content

    def _build_prompt(
        self,
        *,
        repo_name: str,
        target_path: str,
        instruction: str,
        original_content: str,
    ) -> str:
        return (
            f"Repository name: {repo_name}\n"
            f"Target file: {target_path.strip().strip('/')}\n"
            f"Instruction: {instruction}\n\n"
            "Current file content:\n"
            "```text\n"
            f"{original_content}\n"
            "```"
        )

    def _build_unified_diff(
        self,
        *,
        target_path: str,
        original_content: str,
        proposed_content: str,
    ) -> str:
        diff_lines = difflib.unified_diff(
            original_content.splitlines(),
            proposed_content.splitlines(),
            fromfile=f"a/{target_path.strip().strip('/')}",
            tofile=f"b/{target_path.strip().strip('/')}",
            lineterm="",
        )
        return "\n".join(diff_lines)

    def _count_lines(self, content: str) -> int:
        if not content:
            return 0
        return len(content.splitlines())

    def _normalize_content(self, content: str) -> str:
        normalized = content.replace("\r\n", "\n")
        if normalized and not normalized.endswith("\n"):
            normalized += "\n"
        return normalized

    def _hash_content(self, content: str) -> str:
        return hashlib.sha256(content.encode("utf-8")).hexdigest()

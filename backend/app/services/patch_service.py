from __future__ import annotations

import difflib
import hashlib
import os
from dataclasses import dataclass
from pathlib import Path
from time import perf_counter
from uuid import uuid4

from agents import Runner
from sqlalchemy.orm import Session

from app.agents.patch_draft_agent import PatchDraftFinalOutput, build_patch_draft_agent
from app.core.config import get_settings
from app.schemas.checks import CheckRunRequest
from app.schemas.patch import (
    PatchApplyAndCheckRequest,
    PatchApplyAndCheckResponse,
    PatchApplyFile,
    PatchApplyRequest,
    PatchApplyResponse,
    PatchBatchApplyAndCheckRequest,
    PatchBatchApplyAndCheckResponse,
    PatchBatchApplyRequest,
    PatchBatchApplyResponse,
    PatchBatchDraftRequest,
    PatchBatchDraftResponse,
    PatchDraftFile,
    PatchDraftRequest,
    PatchDraftResponse,
    PatchDraftTraceSummary,
)
from app.services.checks_service import CheckService
from app.services.repository_service import RepositoryService, RepositoryValidationError

MAX_PATCH_FILE_CHARS = 20_000
MAX_PATCH_FILE_LINES = 500
MAX_BATCH_PATCH_FILES = 5


class PatchConfigurationError(ValueError):
    """Raised when the patch drafting runtime is not configured correctly."""


class PatchConflictError(ValueError):
    """Raised when a patch apply request is stale against the current file content."""


@dataclass
class PreparedPatchApply:
    repo_id: int
    target_path: str
    file_path: Path
    current_content: str
    current_hash: str
    proposed_content: str
    unified_diff: str


class PatchService:
    def __init__(self, db: Session):
        self.db = db
        self.check_service = CheckService(db)
        self.repository_service = RepositoryService(db)

    async def draft_patch(self, payload: PatchDraftRequest) -> PatchDraftResponse:
        session_id = payload.session_id or uuid4().hex
        settings, repository = self._prepare_patch_drafting(payload.repo_id)
        draft_file = await self._draft_patch_file(
            repository=repository,
            target_path=payload.target_path,
            instruction=payload.instruction,
            model=settings.openai_model,
        )
        return PatchDraftResponse(
            session_id=session_id,
            repo_id=payload.repo_id,
            **draft_file.model_dump(),
        )

    async def draft_patch_batch(self, payload: PatchBatchDraftRequest) -> PatchBatchDraftResponse:
        session_id = payload.session_id or uuid4().hex
        settings, repository = self._prepare_patch_drafting(payload.repo_id)
        target_paths, batch_warnings = self._normalize_target_paths(payload.target_paths)

        started_at = perf_counter()
        items: list[PatchDraftFile] = []
        for target_path in target_paths:
            items.append(
                await self._draft_patch_file(
                    repository=repository,
                    target_path=target_path,
                    instruction=payload.instruction,
                    model=settings.openai_model,
                )
            )
        latency_ms = int((perf_counter() - started_at) * 1000)

        combined_unified_diff = "\n\n".join(item.unified_diff for item in items if item.unified_diff)
        warnings = list(batch_warnings)
        warnings.extend(
            f"{item.target_path}: {warning}"
            for item in items
            for warning in item.warnings
        )
        changed_file_count = len(items)
        total_original_line_count = sum(item.original_line_count for item in items)
        total_proposed_line_count = sum(item.proposed_line_count for item in items)
        diff_free_count = sum(1 for item in items if not item.unified_diff)
        if diff_free_count:
            warnings.append(
                f"{diff_free_count} file(s) did not produce a textual diff. Review the item-level warnings before applying anything."
            )

        return PatchBatchDraftResponse(
            session_id=session_id,
            repo_id=payload.repo_id,
            target_paths=target_paths,
            summary=(
                f"Generated patch drafts for {changed_file_count} file(s). "
                "Review the grouped diffs first, then apply any accepted changes one file at a time."
            ),
            warnings=warnings,
            changed_file_count=changed_file_count,
            total_original_line_count=total_original_line_count,
            total_proposed_line_count=total_proposed_line_count,
            total_line_count_delta=total_proposed_line_count - total_original_line_count,
            combined_unified_diff=combined_unified_diff,
            items=items,
            trace_summary=PatchDraftTraceSummary(
                agent_name=items[0].trace_summary.agent_name if items else "PatchDraftAssistant",
                model=settings.openai_model,
                latency_ms=latency_ms,
            ),
        )

    def apply_patch(self, payload: PatchApplyRequest) -> PatchApplyResponse:
        prepared_items = self._prepare_patch_apply_items(
            payload.repo_id,
            [
                PatchApplyFile(
                    target_path=payload.target_path,
                    expected_base_sha256=payload.expected_base_sha256,
                    proposed_content=payload.proposed_content,
                )
            ],
        )
        return self._write_prepared_patches(prepared_items)[0]

    def apply_patch_batch(self, payload: PatchBatchApplyRequest) -> PatchBatchApplyResponse:
        prepared_items = self._prepare_patch_apply_items(payload.repo_id, payload.items)
        results = self._write_prepared_patches(prepared_items)
        return self._build_batch_apply_response(payload.repo_id, results)

    def apply_patch_and_run_checks(
        self,
        payload: PatchApplyAndCheckRequest,
    ) -> PatchApplyAndCheckResponse:
        self._validate_check_profile_selection(payload.repo_id, payload.profile_ids)

        patch_result = self.apply_patch(
            PatchApplyRequest(
                repo_id=payload.repo_id,
                target_path=payload.target_path,
                expected_base_sha256=payload.expected_base_sha256,
                proposed_content=payload.proposed_content,
            )
        )
        check_result = self.check_service.run_checks(
            CheckRunRequest(repo_id=payload.repo_id, profile_ids=payload.profile_ids)
        )
        return PatchApplyAndCheckResponse(
            patch=patch_result,
            checks=check_result,
        )

    def apply_patch_batch_and_run_checks(
        self,
        payload: PatchBatchApplyAndCheckRequest,
    ) -> PatchBatchApplyAndCheckResponse:
        self._validate_check_profile_selection(payload.repo_id, payload.profile_ids)

        patch_result = self.apply_patch_batch(
            PatchBatchApplyRequest(
                repo_id=payload.repo_id,
                items=payload.items,
            )
        )
        check_result = self.check_service.run_checks(
            CheckRunRequest(repo_id=payload.repo_id, profile_ids=payload.profile_ids)
        )
        return PatchBatchApplyAndCheckResponse(
            patch=patch_result,
            checks=check_result,
        )

    def _prepare_patch_drafting(self, repo_id: int):
        settings = get_settings()
        if not os.getenv("OPENAI_API_KEY"):
            raise PatchConfigurationError(
                "OPENAI_API_KEY is not configured. Set it before calling /api/patches/draft."
            )

        repository = self.repository_service.get_repository(repo_id)
        self.repository_service.resolve_repository_root(repository)

        return settings, repository

    async def _run_agent(self, *, prompt: str, model: str) -> tuple[PatchDraftFinalOutput, str]:
        agent = build_patch_draft_agent(model)
        result = await Runner.run(agent, prompt)
        final_output = result.final_output
        if not isinstance(final_output, PatchDraftFinalOutput):
            raise PatchConfigurationError("The patch draft assistant returned an unexpected output type.")

        agent_name = getattr(getattr(result, "last_agent", None), "name", agent.name)
        return final_output, agent_name

    async def _draft_patch_file(
        self,
        *,
        repository,
        target_path: str,
        instruction: str,
        model: str,
    ) -> PatchDraftFile:
        normalized_target_path = target_path.strip().strip("/")
        _, original_content = self._read_target_file_from_repository(repository, normalized_target_path)
        prompt = self._build_prompt(
            repo_name=repository.name,
            target_path=normalized_target_path,
            instruction=instruction,
            original_content=original_content,
        )

        started_at = perf_counter()
        final_output, agent_name = await self._run_agent(prompt=prompt, model=model)
        latency_ms = int((perf_counter() - started_at) * 1000)

        proposed_content = self._normalize_content(final_output.proposed_content)
        original_line_count = self._count_lines(original_content)
        proposed_line_count = self._count_lines(proposed_content)
        unified_diff = self._build_unified_diff(
            target_path=normalized_target_path,
            original_content=original_content,
            proposed_content=proposed_content,
        )

        warnings = list(final_output.warnings)
        if not unified_diff:
            warnings.append("The draft did not introduce a textual diff. Refine the instruction if you expected a code change.")

        return PatchDraftFile(
            target_path=normalized_target_path,
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
                model=model,
                latency_ms=latency_ms,
            ),
        )

    def _read_target_file(self, repo_id: int, target_path: str) -> tuple[Path, str]:
        repository = self.repository_service.get_repository(repo_id)
        return self._read_target_file_from_repository(repository, target_path)

    def _read_target_file_from_repository(self, repository, target_path: str) -> tuple[Path, str]:
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

    def _normalize_target_paths(self, target_paths: list[str]) -> tuple[list[str], list[str]]:
        normalized_paths: list[str] = []
        warnings: list[str] = []
        seen_paths: set[str] = set()

        for raw_target_path in target_paths:
            normalized_target_path = raw_target_path.strip().strip("/")
            if not normalized_target_path:
                continue
            if normalized_target_path in seen_paths:
                warnings.append(f"Skipped duplicate target path: {normalized_target_path}.")
                continue
            seen_paths.add(normalized_target_path)
            normalized_paths.append(normalized_target_path)

        if not normalized_paths:
            raise RepositoryValidationError("Provide at least one non-empty target path for a batch draft.")
        if len(normalized_paths) > MAX_BATCH_PATCH_FILES:
            raise RepositoryValidationError(
                f"Batch patch preview currently supports up to {MAX_BATCH_PATCH_FILES} files per request."
            )

        return normalized_paths, warnings

    def _prepare_patch_apply_items(
        self,
        repo_id: int,
        items: list[PatchApplyFile],
    ) -> list[PreparedPatchApply]:
        repository = self.repository_service.get_repository(repo_id)
        self.repository_service.resolve_repository_root(repository)

        prepared_items: list[PreparedPatchApply] = []
        seen_paths: set[str] = set()

        for item in items:
            normalized_target_path = item.target_path.strip().strip("/")
            if normalized_target_path in seen_paths:
                raise RepositoryValidationError(
                    f"Duplicate target path is not allowed in a batch apply request: {normalized_target_path}."
                )
            seen_paths.add(normalized_target_path)

            file_path, current_content = self._read_target_file_from_repository(repository, normalized_target_path)
            current_hash = self._hash_content(current_content)
            if current_hash != item.expected_base_sha256:
                raise PatchConflictError(
                    f"The target file changed since this draft was generated: {normalized_target_path}. "
                    "Re-generate the patch draft before applying."
                )

            proposed_content = self._normalize_content(item.proposed_content)
            unified_diff = self._build_unified_diff(
                target_path=normalized_target_path,
                original_content=current_content,
                proposed_content=proposed_content,
            )
            prepared_items.append(
                PreparedPatchApply(
                    repo_id=repo_id,
                    target_path=normalized_target_path,
                    file_path=file_path,
                    current_content=current_content,
                    current_hash=current_hash,
                    proposed_content=proposed_content,
                    unified_diff=unified_diff,
                )
            )

        return prepared_items

    def _write_prepared_patches(self, prepared_items: list[PreparedPatchApply]) -> list[PatchApplyResponse]:
        rollback_snapshots: list[tuple[Path, str]] = []
        results: list[PatchApplyResponse] = []

        try:
            for prepared in prepared_items:
                if not prepared.unified_diff:
                    results.append(
                        PatchApplyResponse(
                            repo_id=prepared.repo_id,
                            target_path=prepared.target_path,
                            status="noop",
                            message="The proposed content already matches the current file. Nothing was written.",
                            previous_sha256=prepared.current_hash,
                            written_sha256=prepared.current_hash,
                            written_line_count=self._count_lines(prepared.current_content),
                            unified_diff=prepared.unified_diff,
                        )
                    )
                    continue

                prepared.file_path.write_text(prepared.proposed_content, encoding="utf-8")
                rollback_snapshots.append((prepared.file_path, prepared.current_content))
                written_hash = self._hash_content(prepared.proposed_content)
                results.append(
                    PatchApplyResponse(
                        repo_id=prepared.repo_id,
                        target_path=prepared.target_path,
                        status="applied",
                        message="The patch draft was written to the working tree successfully.",
                        previous_sha256=prepared.current_hash,
                        written_sha256=written_hash,
                        written_line_count=self._count_lines(prepared.proposed_content),
                        unified_diff=prepared.unified_diff,
                    )
                )
        except OSError as exc:
            for file_path, original_content in reversed(rollback_snapshots):
                file_path.write_text(original_content, encoding="utf-8")
            raise RepositoryValidationError(
                "Failed to apply the requested patch set cleanly. Any earlier file writes were rolled back."
            ) from exc

        return results

    def _build_batch_apply_response(
        self,
        repo_id: int,
        results: list[PatchApplyResponse],
    ) -> PatchBatchApplyResponse:
        applied_count = sum(1 for item in results if item.status == "applied")
        noop_count = len(results) - applied_count
        status = "applied" if applied_count > 0 else "noop"
        target_paths = [item.target_path for item in results]
        combined_unified_diff = "\n\n".join(item.unified_diff for item in results if item.unified_diff)

        if applied_count > 0 and noop_count > 0:
            message = (
                f"Applied {applied_count} file(s) successfully. "
                f"{noop_count} file(s) already matched the proposed content."
            )
        elif applied_count > 0:
            message = f"Applied {applied_count} file(s) to the working tree successfully."
        else:
            message = "All selected files already matched the proposed content. Nothing was written."

        return PatchBatchApplyResponse(
            repo_id=repo_id,
            status=status,
            message=message,
            applied_count=applied_count,
            noop_count=noop_count,
            target_paths=target_paths,
            combined_unified_diff=combined_unified_diff,
            results=results,
        )

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

    def _validate_check_profile_selection(self, repo_id: int, profile_ids: list[str] | None) -> None:
        if not profile_ids:
            return

        available_ids = {item.id for item in self.check_service.list_profiles(repo_id).items}
        missing = [profile_id for profile_id in profile_ids if profile_id not in available_ids]
        if missing:
            raise RepositoryValidationError(
                f"Unknown check profile ids: {', '.join(sorted(missing))}."
            )

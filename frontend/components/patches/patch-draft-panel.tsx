"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type {
  PatchApplyResponse,
  PatchBatchApplyResponse,
  PatchBatchDraftResponse,
  PatchDraftFile,
  PatchDraftResponse,
  RepositoryRecord,
} from "@/lib/types";
import {
  formatPatchStatus,
  formatRepositoryStatus,
  getWorkspaceCopy,
  type WorkspaceLocale,
} from "@/lib/workspace-i18n";

type PatchDraftPanelProps = {
  selectedRepository: RepositoryRecord | null;
  suggestedPath: string | null;
  isDrafting: boolean;
  isApplying: boolean;
  isApplyingBatch: boolean;
  isApplyingAndChecking: boolean;
  isApplyingBatchAndChecking: boolean;
  recommendedCheckCount: number;
  locale: WorkspaceLocale;
  onDraft: (repoId: number, targetPaths: string[], instruction: string) => Promise<void> | void;
  onOpenChat: () => void;
  onOpenChecks: () => void;
  onApply: (response: PatchDraftResponse) => Promise<void> | void;
  onApplyBatch: (repoId: number, drafts: PatchDraftFile[]) => Promise<void> | void;
  onApplyBatchAndCheck: (repoId: number, drafts: PatchDraftFile[]) => Promise<void> | void;
  onApplyAndCheck: (response: PatchDraftResponse) => Promise<void> | void;
  response: PatchDraftResponse | null;
  batchResponse: PatchBatchDraftResponse | null;
  applyResponse: PatchApplyResponse | null;
  batchApplyResponse: PatchBatchApplyResponse | null;
};

function parseTargetPaths(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function appendSuggestedPath(input: string, suggestedPath: string): string {
  const currentPaths = parseTargetPaths(input);
  if (currentPaths.includes(suggestedPath)) {
    return input;
  }

  if (currentPaths.length === 0) {
    return suggestedPath;
  }

  return `${currentPaths.join("\n")}\n${suggestedPath}`;
}

function formatLineDelta(lineCountDelta: number): string {
  return lineCountDelta >= 0 ? `+${lineCountDelta}` : `${lineCountDelta}`;
}

function DiffPreview({ diff }: { diff: string }) {
  return (
    <div className="diff-preview">
      {diff.split("\n").map((line, index) => {
        const tone =
          line.startsWith("+") && !line.startsWith("+++")
            ? "is-added"
            : line.startsWith("-") && !line.startsWith("---")
              ? "is-removed"
              : line.startsWith("@@")
                ? "is-hunk"
                : line.startsWith("---") || line.startsWith("+++")
                  ? "is-file"
                  : "";

        return (
          <div className={`diff-line ${tone}`.trim()} key={`${line}-${index}`}>
            {line || " "}
          </div>
        );
      })}
    </div>
  );
}

function summarizeApplyResult(locale: WorkspaceLocale, result: PatchApplyResponse): string {
  if (result.status === "applied") {
    return locale === "zh-CN"
      ? `文件已写入，当前共 ${result.written_line_count} 行。`
      : `The file was written successfully and now has ${result.written_line_count} lines.`;
  }
  if (result.status === "rolled_back") {
    return locale === "zh-CN"
      ? "应用后检查失败，改动已经自动回滚。"
      : "The patch was rolled back after verification failed.";
  }
  return locale === "zh-CN"
    ? "当前内容与草案一致，没有额外写入。"
    : "The workspace already matched the proposed content, so no write was needed.";
}

function summarizeBatchItem(locale: WorkspaceLocale, result: PatchApplyResponse): string {
  if (result.status === "applied") {
    return locale === "zh-CN" ? "该文件已写入工作区。" : "This file was written to the workspace.";
  }
  if (result.status === "rolled_back") {
    return locale === "zh-CN"
      ? "该文件所在批次已回滚。"
      : "This file was part of a rolled-back batch.";
  }
  return locale === "zh-CN" ? "该文件无需额外改动。" : "No additional change was needed for this file.";
}

function PatchDraftFileCard({
  item,
  locale,
  isSelected,
  onToggleSelected,
}: {
  item: PatchDraftFile;
  locale: WorkspaceLocale;
  isSelected?: boolean;
  onToggleSelected?: (targetPath: string) => void;
}) {
  const copy = getWorkspaceCopy(locale);
  const isSelectable = typeof onToggleSelected === "function";
  const isDiffFree = !item.unified_diff;

  return (
    <div className={`diff-card ${isSelectable && isSelected ? "is-selected" : ""}`.trim()}>
      {isSelectable ? (
        <label className={`selection-toggle ${isDiffFree ? "is-disabled" : ""}`.trim()}>
          <input
            checked={Boolean(isSelected)}
            disabled={isDiffFree}
            onChange={() => onToggleSelected?.(item.target_path)}
            type="checkbox"
          />
          <span>{isDiffFree ? copy.patch.noApplicableDiff : copy.patch.selectForBatch}</span>
        </label>
      ) : null}

      <div className="answer-header">
        <div className="answer-label">{item.target_path}</div>
        <div className="meta-pill-row">
          <span className="meta-pill">
            {item.original_line_count} → {item.proposed_line_count}
          </span>
          <span className="meta-pill">{formatLineDelta(item.line_count_delta)}</span>
          <span className="meta-pill">{item.base_content_sha256.slice(0, 8)}</span>
        </div>
      </div>

      <div className="patch-copy">{item.summary}</div>
      <div className="patch-rationale">{item.rationale}</div>

      {item.warnings.length > 0 ? (
        <div className="patch-warning-list top-gap">
          {item.warnings.map((warning, index) => (
            <div className="warning-banner" key={`${item.target_path}-warning-${index}`}>
              {warning}
            </div>
          ))}
        </div>
      ) : null}

      {item.unified_diff ? (
        <DiffPreview diff={item.unified_diff} />
      ) : (
        <div className="placeholder-card top-gap">
          <div className="placeholder-copy">{copy.patch.noTextualDiff}</div>
        </div>
      )}
    </div>
  );
}

export function PatchDraftPanel({
  selectedRepository,
  suggestedPath,
  isDrafting,
  isApplying,
  isApplyingBatch,
  isApplyingAndChecking,
  isApplyingBatchAndChecking,
  recommendedCheckCount,
  locale,
  onDraft,
  onOpenChat,
  onOpenChecks,
  onApply,
  onApplyBatch,
  onApplyBatchAndCheck,
  onApplyAndCheck,
  response,
  batchResponse,
  applyResponse,
  batchApplyResponse,
}: PatchDraftPanelProps) {
  const copy = getWorkspaceCopy(locale);
  const actionCopy =
    locale === "zh-CN"
      ? {
          askFirst: "回到问答补充上下文",
          verifyNow: "去检查面板验证",
          fileScope: "文件范围",
        }
      : {
          askFirst: "Return to chat",
          verifyNow: "Go verify in checks",
          fileScope: "File scope",
        };
  const [targetPathsInput, setTargetPathsInput] = useState("");
  const [instruction, setInstruction] = useState(copy.patch.defaultInstruction);
  const [selectedBatchPaths, setSelectedBatchPaths] = useState<string[]>([]);

  useEffect(() => {
    setInstruction(copy.patch.defaultInstruction);
  }, [copy.patch.defaultInstruction]);

  useEffect(() => {
    setTargetPathsInput("");
  }, [selectedRepository?.id]);

  useEffect(() => {
    if (!targetPathsInput && suggestedPath) {
      setTargetPathsInput(suggestedPath);
    }
  }, [suggestedPath, targetPathsInput]);

  useEffect(() => {
    if (!batchResponse) {
      setSelectedBatchPaths([]);
      return;
    }

    setSelectedBatchPaths(
      batchResponse.items
        .filter((item) => item.unified_diff)
        .map((item) => item.target_path),
    );
  }, [batchResponse]);

  const parsedTargetPaths = useMemo(() => parseTargetPaths(targetPathsInput), [targetPathsInput]);
  const selectedBatchDrafts =
    batchResponse?.items.filter((item) => selectedBatchPaths.includes(item.target_path)) ?? [];

  function toggleBatchSelection(targetPath: string) {
    setSelectedBatchPaths((current) =>
      current.includes(targetPath)
        ? current.filter((item) => item !== targetPath)
        : [...current, targetPath],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRepository) {
      return;
    }

    await onDraft(selectedRepository.id, parsedTargetPaths, instruction.trim());
  }

  const hasWorkspaceRoot = Boolean(selectedRepository?.root_path);
  const isBatchMode = parsedTargetPaths.length > 1;

  return (
    <section className="panel-card">
      <h2 className="panel-title">{copy.patch.title}</h2>
      <p className="panel-copy">{copy.patch.description}</p>

      {!selectedRepository ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">{copy.patch.selectRepository}</div>
        </div>
      ) : !hasWorkspaceRoot ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">{copy.patch.missingWorkspace}</div>
        </div>
      ) : (
        <form className="field-grid" onSubmit={handleSubmit}>
          <div className="focus-card">
            <div className="focus-card-label">{copy.patch.targetRepository}</div>
            <div className="focus-card-title">{selectedRepository.name}</div>
            <div className="focus-card-copy">
              {selectedRepository.root_path ?? copy.workspace.unknown}
            </div>
            <div className="meta-pill-row">
              <span className="meta-pill">
                {formatRepositoryStatus(locale, selectedRepository.status)}
              </span>
              <span className="meta-pill">
                {selectedRepository.primary_language ?? copy.workspace.unknown}
              </span>
              <span className="meta-pill">
                {isBatchMode ? copy.patch.multiFilePreview : copy.patch.singleFileSafeApply}
              </span>
              <span className="meta-pill">
                {actionCopy.fileScope}: {parsedTargetPaths.length || 0}
              </span>
            </div>
          </div>

          <label className="field-label">
            {copy.patch.targetPaths}
            <textarea
              className="textarea-input"
              onChange={(event) => setTargetPathsInput(event.target.value)}
              placeholder={copy.patch.targetPathsPlaceholder}
              rows={4}
              value={targetPathsInput}
            />
          </label>
          <p className="field-help">{copy.patch.targetPathsHelp}</p>

          {suggestedPath ? (
            <div className="button-row">
              <button
                className="button-secondary"
                onClick={() =>
                  setTargetPathsInput((current) => appendSuggestedPath(current, suggestedPath))
                }
                type="button"
              >
                {copy.patch.addSuggestedPath}
              </button>
            </div>
          ) : null}

          <label className="field-label">
            {copy.patch.instruction}
            <textarea
              className="textarea-input"
              onChange={(event) => setInstruction(event.target.value)}
              rows={5}
              value={instruction}
            />
          </label>

          <div className="button-row">
            <button
              className="button-primary"
              disabled={isDrafting || parsedTargetPaths.length === 0 || !instruction.trim()}
              type="submit"
            >
              {isDrafting
                ? copy.patch.generating
                : isBatchMode
                  ? copy.patch.generateBatch(parsedTargetPaths.length)
                  : copy.patch.generateSingle}
            </button>
            <button className="button-secondary" onClick={onOpenChat} type="button">
              {actionCopy.askFirst}
            </button>
          </div>
        </form>
      )}

      {response ? (
        <div className="patch-stack">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">{copy.patch.targetFile}</div>
              <div className="summary-value">{response.target_path}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">{copy.patch.lineDelta}</div>
              <div className="summary-value">{formatLineDelta(response.line_count_delta)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">{copy.patch.latency}</div>
              <div className="summary-value">{response.trace_summary.latency_ms} ms</div>
            </div>
          </div>

          <div className="answer-card">
            <div className="answer-header">
              <div className="answer-label">{copy.patch.summary}</div>
              <div className="meta-pill-row">
                <span className="meta-pill">{response.trace_summary.agent_name}</span>
                <span className="meta-pill">{response.trace_summary.model}</span>
              </div>
            </div>
            <div className="patch-copy">{response.summary}</div>
            <div className="patch-rationale">{response.rationale}</div>
          </div>

          {response.warnings.length > 0 ? (
            <div className="patch-warning-list">
              {response.warnings.map((warning, index) => (
                <div className="warning-banner" key={`${warning}-${index}`}>
                  {warning}
                </div>
              ))}
            </div>
          ) : null}

          <div className="diff-card">
            <div className="answer-header">
              <div className="answer-label">{copy.patch.diffPreview}</div>
              <div className="meta-pill-row">
                <span className="meta-pill">
                  {response.original_line_count} → {response.proposed_line_count}
                </span>
                <span className="meta-pill">{response.base_content_sha256.slice(0, 8)}</span>
              </div>
            </div>
            <div className="button-row patch-action-row">
              <button
                className="button-primary"
                disabled={
                  isApplying ||
                  isApplyingAndChecking ||
                  !response.unified_diff ||
                  applyResponse?.status === "applied"
                }
                onClick={() => onApply(response)}
                type="button"
              >
                {applyResponse?.status === "applied"
                  ? copy.patch.alreadyApplied
                  : isApplying
                    ? copy.patch.applying
                    : copy.patch.confirmApply}
              </button>
              <button
                className="button-secondary"
                disabled={
                  isApplying ||
                  isApplyingAndChecking ||
                  !response.unified_diff ||
                  applyResponse?.status === "applied"
                }
                onClick={() => onApplyAndCheck(response)}
                type="button"
              >
                {isApplyingAndChecking
                  ? copy.patch.applyingAndVerifying
                  : recommendedCheckCount > 0
                    ? copy.patch.applyAndVerify(recommendedCheckCount)
                    : copy.patch.applyAndVerifyDefault}
              </button>
              <button className="button-secondary" onClick={onOpenChecks} type="button">
                {actionCopy.verifyNow}
              </button>
              <div className="field-help">{copy.patch.applyHelp}</div>
            </div>
            {response.unified_diff ? (
              <DiffPreview diff={response.unified_diff} />
            ) : (
              <div className="placeholder-card">
                <div className="placeholder-copy">{copy.patch.noDiff}</div>
              </div>
            )}
          </div>

          {applyResponse ? (
            <div className="success-banner">
              {summarizeApplyResult(locale, applyResponse)}
              {applyResponse.status === "applied"
                ? ` ${copy.patch.writeSuccess(
                    applyResponse.target_path,
                    applyResponse.written_line_count,
                  )}`
                : ""}
            </div>
          ) : null}
        </div>
      ) : null}

      {batchResponse ? (
        <div className="patch-stack">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">{copy.patch.fileCount}</div>
              <div className="summary-value">{batchResponse.changed_file_count}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">{copy.patch.lineDelta}</div>
              <div className="summary-value">{formatLineDelta(batchResponse.total_line_count_delta)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">{copy.patch.totalLatency}</div>
              <div className="summary-value">{batchResponse.trace_summary.latency_ms} ms</div>
            </div>
          </div>

          <div className="answer-card">
            <div className="answer-header">
              <div className="answer-label">{copy.patch.batchSummary}</div>
              <div className="meta-pill-row">
                <span className="meta-pill">{batchResponse.trace_summary.agent_name}</span>
                <span className="meta-pill">{batchResponse.trace_summary.model}</span>
              </div>
            </div>
            <div className="patch-copy">{batchResponse.summary}</div>
            <div className="patch-rationale">{copy.patch.changeSummary}</div>
          </div>

          {batchResponse.warnings.length > 0 ? (
            <div className="patch-warning-list">
              {batchResponse.warnings.map((warning, index) => (
                <div className="warning-banner" key={`${warning}-${index}`}>
                  {warning}
                </div>
              ))}
            </div>
          ) : null}

          <div className="focus-card">
            <div className="focus-card-label">{copy.patch.batchModeTitle}</div>
            <div className="focus-card-title">{copy.patch.combinedDiff}</div>
            <div className="focus-card-copy">
              {recommendedCheckCount > 0
                ? copy.patch.batchModeCopyWithRecommended(recommendedCheckCount)
                : copy.patch.batchModeCopyDefault}
            </div>
            <div className="meta-pill-row top-gap">
              <span className="meta-pill">
                {copy.patch.selectedCount}: {selectedBatchDrafts.length}
              </span>
              <span className="meta-pill">
                {copy.patch.changedFiles}: {batchResponse.changed_file_count}
              </span>
              <span className="meta-pill">
                {batchResponse.total_original_line_count} → {batchResponse.total_proposed_line_count}
              </span>
            </div>
          </div>

          <div className="button-row patch-action-row">
            <button
              className="button-primary"
              disabled={isApplyingBatch || isApplyingBatchAndChecking || selectedBatchDrafts.length === 0}
              onClick={() => onApplyBatch(batchResponse.repo_id, selectedBatchDrafts)}
              type="button"
            >
              {isApplyingBatch
                ? copy.patch.applyingBatch
                : copy.patch.applySelected(selectedBatchDrafts.length)}
            </button>
            <button
              className="button-secondary"
              disabled={isApplyingBatch || isApplyingBatchAndChecking || selectedBatchDrafts.length === 0}
              onClick={() => onApplyBatchAndCheck(batchResponse.repo_id, selectedBatchDrafts)}
              type="button"
            >
              {isApplyingBatchAndChecking
                ? copy.patch.applyingBatchAndVerifying
                : recommendedCheckCount > 0
                  ? copy.patch.applySelectedAndVerify(recommendedCheckCount)
                  : copy.patch.applySelectedAndVerifyDefault}
            </button>
            <button className="button-secondary" onClick={onOpenChecks} type="button">
              {actionCopy.verifyNow}
            </button>
            <div className="field-help">{copy.patch.batchHelp}</div>
          </div>

          {batchResponse.combined_unified_diff ? (
            <div className="diff-card">
              <div className="answer-header">
                <div className="answer-label">{copy.patch.combinedDiff}</div>
                <div className="meta-pill-row">
                  <span className="meta-pill">
                    {batchResponse.total_original_line_count} → {batchResponse.total_proposed_line_count}
                  </span>
                </div>
              </div>
              <DiffPreview diff={batchResponse.combined_unified_diff} />
            </div>
          ) : null}

          {batchApplyResponse ? (
            <div className="answer-card">
              <div className="answer-header">
                <div className="answer-label">{copy.patch.batchApplyResult}</div>
                <div className="meta-pill-row">
                  <span className="meta-pill">{formatPatchStatus(locale, batchApplyResponse.status)}</span>
                  <span className="meta-pill">
                    {copy.patch.appliedCount}: {batchApplyResponse.applied_count}
                  </span>
                  <span className="meta-pill">
                    {copy.patch.noopCount}: {batchApplyResponse.noop_count}
                  </span>
                </div>
              </div>
              <div className="patch-copy">
                {locale === "zh-CN"
                  ? `本批次共处理 ${batchApplyResponse.results.length} 个文件。`
                  : `This batch processed ${batchApplyResponse.results.length} files.`}
              </div>
              <div className="patch-result-list top-gap">
                {batchApplyResponse.results.map((result) => (
                  <div className="check-profile-card" key={result.target_path}>
                    <div className="answer-header">
                      <div className="answer-label">{result.target_path}</div>
                      <span className="meta-pill">{formatPatchStatus(locale, result.status)}</span>
                    </div>
                    <div className="patch-rationale">{summarizeBatchItem(locale, result)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {batchResponse.items.map((item) => (
            <PatchDraftFileCard
              isSelected={selectedBatchPaths.includes(item.target_path)}
              item={item}
              key={item.target_path}
              locale={locale}
              onToggleSelected={toggleBatchSelection}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

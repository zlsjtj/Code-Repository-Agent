"use client";

import { FormEvent, useEffect, useState } from "react";

import type {
  PatchApplyResponse,
  PatchBatchApplyResponse,
  PatchBatchDraftResponse,
  PatchDraftFile,
  PatchDraftResponse,
  RepositoryRecord,
} from "@/lib/types";

type PatchDraftPanelProps = {
  selectedRepository: RepositoryRecord | null;
  suggestedPath: string | null;
  isDrafting: boolean;
  isApplying: boolean;
  isApplyingBatch: boolean;
  isApplyingAndChecking: boolean;
  isApplyingBatchAndChecking: boolean;
  recommendedCheckCount: number;
  onDraft: (repoId: number, targetPaths: string[], instruction: string) => Promise<void> | void;
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

function PatchDraftFileCard({
  item,
  isSelected,
  onToggleSelected,
}: {
  item: PatchDraftFile;
  isSelected?: boolean;
  onToggleSelected?: (targetPath: string) => void;
}) {
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
          <span>{isDiffFree ? "无可应用 diff" : "包含到批量应用"}</span>
        </label>
      ) : null}
      <div className="answer-header">
        <div className="answer-label">{item.target_path}</div>
        <div className="meta-pill-row">
          <span className="meta-pill">
            {item.original_line_count} to {item.proposed_line_count} lines
          </span>
          <span className="meta-pill">{formatLineDelta(item.line_count_delta)}</span>
          <span className="meta-pill">base {item.base_content_sha256.slice(0, 8)}</span>
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
          <div className="placeholder-copy">
            这个文件的草案没有生成文本 diff。通常意味着提示不够具体，或者模型判断当前文件无需修改。
          </div>
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
  onDraft,
  onApply,
  onApplyBatch,
  onApplyBatchAndCheck,
  onApplyAndCheck,
  response,
  batchResponse,
  applyResponse,
  batchApplyResponse,
}: PatchDraftPanelProps) {
  const [targetPathsInput, setTargetPathsInput] = useState("");
  const [instruction, setInstruction] = useState(
    "请围绕这些目标文件做最小必要改动，并返回清晰的 unified diff 预览。",
  );
  const [selectedBatchPaths, setSelectedBatchPaths] = useState<string[]>([]);

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

  const parsedTargetPaths = parseTargetPaths(targetPathsInput);
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
      <h2 className="panel-title">Patch 草案</h2>
      <p className="panel-copy">
        单文件草案会继续保留安全应用入口；如果一次输入多个目标路径，系统会按同一条 instruction 逐个生成草案，并把 diff 按文件分组返回，方便先统一预览。
      </p>

      {!selectedRepository ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">先选择一个仓库，再生成 patch 草案。</div>
        </div>
      ) : !hasWorkspaceRoot ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">
            当前仓库还没有可用工作区。先确保它已经导入本地路径，或者已经从 GitHub clone 成功。
          </div>
        </div>
      ) : (
        <form className="field-grid" onSubmit={handleSubmit}>
          <div className="focus-card">
            <div className="focus-card-label">草案目标仓库</div>
            <div className="focus-card-title">{selectedRepository.name}</div>
            <div className="focus-card-copy">
              {selectedRepository.root_path ?? "未找到本地路径"}
            </div>
            <div className="meta-pill-row">
              <span className="meta-pill">{selectedRepository.status}</span>
              <span className="meta-pill">{selectedRepository.primary_language ?? "language unknown"}</span>
              <span className="meta-pill">
                {isBatchMode ? "multi-file preview" : "single-file safe apply"}
              </span>
            </div>
          </div>

          <label className="field-label">
            目标文件路径
            <textarea
              className="textarea-input"
              onChange={(event) => setTargetPathsInput(event.target.value)}
              placeholder={"一行一个路径，例如\nbackend/app/services/chat_service.py\nfrontend/components/checks/checks-panel.tsx"}
              rows={4}
              value={targetPathsInput}
            />
          </label>
          <p className="field-help">
            一行一个路径。单文件时继续走原来的安全应用流程；多文件时会先给出 grouped diff，并支持勾选后批量写回。
          </p>

          {suggestedPath ? (
            <div className="button-row">
              <button
                className="button-secondary"
                onClick={() => setTargetPathsInput((current) => appendSuggestedPath(current, suggestedPath))}
                type="button"
              >
                添加最近引用文件
              </button>
            </div>
          ) : null}

          <label className="field-label">
            改动意图
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
                ? "生成中..."
                : isBatchMode
                  ? `生成多文件 patch 草案 (${parsedTargetPaths.length})`
                  : "生成 patch 草案"}
            </button>
          </div>
        </form>
      )}

      {response ? (
        <div className="patch-stack">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">目标文件</div>
              <div className="summary-value">{response.target_path}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">行数变化</div>
              <div className="summary-value">{formatLineDelta(response.line_count_delta)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">生成耗时</div>
              <div className="summary-value">{response.trace_summary.latency_ms} ms</div>
            </div>
          </div>

          <div className="answer-card">
            <div className="answer-header">
              <div className="answer-label">变更摘要</div>
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
              <div className="answer-label">Unified Diff 预览</div>
              <div className="meta-pill-row">
                <span className="meta-pill">
                  {response.original_line_count} to {response.proposed_line_count} lines
                </span>
                <span className="meta-pill">base {response.base_content_sha256.slice(0, 8)}</span>
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
                  ? "已应用到工作区"
                  : isApplying
                    ? "应用中..."
                    : "确认应用到工作区"}
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
                  ? "应用并验证中..."
                  : recommendedCheckCount > 0
                    ? `应用并运行推荐检查 (${recommendedCheckCount})`
                    : "应用并运行默认检查"}
              </button>
              <div className="field-help">
                应用前会校验文件基线哈希；如果文件已经变化，后端会拒绝写入，避免覆盖未预览的新内容。
              </div>
            </div>
            {response.unified_diff ? (
              <DiffPreview diff={response.unified_diff} />
            ) : (
              <div className="placeholder-card">
                <div className="placeholder-copy">
                  这次草案没有生成文本 diff。通常意味着提示不够具体，或者模型判断当前文件无需修改。
                </div>
              </div>
            )}
          </div>

          {applyResponse ? (
            <div className="success-banner">
              {applyResponse.message}
              {applyResponse.status === "applied"
                ? ` 已写入 ${applyResponse.target_path}，当前共 ${applyResponse.written_line_count} 行。`
                : ""}
            </div>
          ) : null}
        </div>
      ) : null}

      {batchResponse ? (
        <div className="patch-stack">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">目标文件数</div>
              <div className="summary-value">{batchResponse.changed_file_count}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">总行数变化</div>
              <div className="summary-value">{formatLineDelta(batchResponse.total_line_count_delta)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">总耗时</div>
              <div className="summary-value">{batchResponse.trace_summary.latency_ms} ms</div>
            </div>
          </div>

          <div className="answer-card">
            <div className="answer-header">
              <div className="answer-label">批量草案摘要</div>
              <div className="meta-pill-row">
                <span className="meta-pill">{batchResponse.trace_summary.agent_name}</span>
                <span className="meta-pill">{batchResponse.trace_summary.model}</span>
              </div>
            </div>
            <div className="patch-copy">{batchResponse.summary}</div>
            <div className="patch-rationale">
              这一步除了 grouped diff 预览，还支持在下方逐项勾选要落地的文件。批量 apply 会先统一校验所有基线哈希，再开始写回；其中任意一个文件冲突，整批都会拒绝，避免半成功状态。
            </div>
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
            <div className="focus-card-label">批量预览模式</div>
            <div className="focus-card-title">先统一看 diff，再决定要应用哪些文件</div>
            <div className="focus-card-copy">
              {recommendedCheckCount > 0
                ? `这批改动已经拿到 ${recommendedCheckCount} 个推荐 checks，可以直接在下方 Checks 面板运行。`
                : "这批改动已经进入推荐 checks 流程；如果没有命中更具体的规则，下方 Checks 面板会回退到全部已发现检查。"}
            </div>
            <div className="meta-pill-row top-gap">
              <span className="meta-pill">selected {selectedBatchDrafts.length}</span>
              <span className="meta-pill">changed {batchResponse.changed_file_count}</span>
              <span className="meta-pill">
                {batchResponse.total_original_line_count} to {batchResponse.total_proposed_line_count} lines
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
                ? "批量应用中..."
                : `应用选中文件 (${selectedBatchDrafts.length})`}
            </button>
            <button
              className="button-secondary"
              disabled={isApplyingBatch || isApplyingBatchAndChecking || selectedBatchDrafts.length === 0}
              onClick={() => onApplyBatchAndCheck(batchResponse.repo_id, selectedBatchDrafts)}
              type="button"
            >
              {isApplyingBatchAndChecking
                ? "批量应用并验证中..."
                : recommendedCheckCount > 0
                  ? `应用选中文件并运行推荐检查 (${recommendedCheckCount})`
                  : "应用选中文件并运行默认检查"}
            </button>
            <div className="field-help">
              选中文件会作为一个批次整体提交。后端会先完成全量哈希校验，再执行写回；如果某个文件已经变化，会整批拒绝。
            </div>
          </div>

          {batchResponse.combined_unified_diff ? (
            <div className="diff-card">
              <div className="answer-header">
                <div className="answer-label">Combined Diff 预览</div>
                <div className="meta-pill-row">
                  <span className="meta-pill">
                    {batchResponse.total_original_line_count} to {batchResponse.total_proposed_line_count} lines
                  </span>
                </div>
              </div>
              <DiffPreview diff={batchResponse.combined_unified_diff} />
            </div>
          ) : null}

          {batchApplyResponse ? (
            <div className="answer-card">
              <div className="answer-header">
                <div className="answer-label">批量应用结果</div>
                <div className="meta-pill-row">
                  <span className="meta-pill">{batchApplyResponse.status}</span>
                  <span className="meta-pill">applied {batchApplyResponse.applied_count}</span>
                  <span className="meta-pill">noop {batchApplyResponse.noop_count}</span>
                </div>
              </div>
              <div className="patch-copy">{batchApplyResponse.message}</div>
              <div className="patch-result-list top-gap">
                {batchApplyResponse.results.map((result) => (
                  <div className="check-profile-card" key={result.target_path}>
                    <div className="answer-header">
                      <div className="answer-label">{result.target_path}</div>
                      <span className="meta-pill">{result.status}</span>
                    </div>
                    <div className="patch-rationale">{result.message}</div>
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
              onToggleSelected={toggleBatchSelection}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

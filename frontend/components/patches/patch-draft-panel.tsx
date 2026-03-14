"use client";

import { FormEvent, useEffect, useState } from "react";

import type { PatchApplyResponse, PatchDraftResponse, RepositoryRecord } from "@/lib/types";

type PatchDraftPanelProps = {
  selectedRepository: RepositoryRecord | null;
  suggestedPath: string | null;
  isDrafting: boolean;
  isApplying: boolean;
  isApplyingAndChecking: boolean;
  recommendedCheckCount: number;
  onDraft: (repoId: number, targetPath: string, instruction: string) => Promise<void> | void;
  onApply: (response: PatchDraftResponse) => Promise<void> | void;
  onApplyAndCheck: (response: PatchDraftResponse) => Promise<void> | void;
  response: PatchDraftResponse | null;
  applyResponse: PatchApplyResponse | null;
};

export function PatchDraftPanel({
  selectedRepository,
  suggestedPath,
  isDrafting,
  isApplying,
  isApplyingAndChecking,
  recommendedCheckCount,
  onDraft,
  onApply,
  onApplyAndCheck,
  response,
  applyResponse,
}: PatchDraftPanelProps) {
  const [targetPath, setTargetPath] = useState("");
  const [instruction, setInstruction] = useState("在这个文件里做一个最小改动，并给我 unified diff 预览。");

  useEffect(() => {
    setTargetPath("");
  }, [selectedRepository?.id]);

  useEffect(() => {
    if (!targetPath && suggestedPath) {
      setTargetPath(suggestedPath);
    }
  }, [suggestedPath, targetPath]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRepository) {
      return;
    }
    await onDraft(selectedRepository.id, targetPath.trim(), instruction.trim());
  }

  const isLocalRepository = selectedRepository?.source_type === "local";

  return (
    <section className="panel-card">
      <h2 className="panel-title">Patch 草案</h2>
      <p className="panel-copy">
        这一版先支持单文件 patch 草案。你给出目标文件和改动意图，后端会返回完整草案和 unified diff 预览，但不会直接写回仓库。
      </p>

      {!selectedRepository ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">先选择一个仓库，再生成 patch 草案。</div>
        </div>
      ) : !isLocalRepository ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">
            当前只支持本地仓库的 patch 草案。GitHub 仓库还停留在元信息登记阶段。
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
            </div>
          </div>

          <label className="field-label">
            目标文件路径
            <input
              onChange={(event) => setTargetPath(event.target.value)}
              placeholder="例如 backend/app/services/chat_service.py"
              value={targetPath}
            />
          </label>

          {suggestedPath ? (
            <div className="button-row">
              <button
                className="button-secondary"
                onClick={() => setTargetPath(suggestedPath)}
                type="button"
              >
                使用最近引用文件
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
              disabled={isDrafting || !targetPath.trim() || !instruction.trim()}
              type="submit"
            >
              {isDrafting ? "生成中..." : "生成 patch 草案"}
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
              <div className="summary-value">{response.line_count_delta >= 0 ? `+${response.line_count_delta}` : response.line_count_delta}</div>
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
                  {response.original_line_count} → {response.proposed_line_count} lines
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
              <div className="diff-preview">
                {response.unified_diff.split("\n").map((line, index) => {
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
    </section>
  );
}

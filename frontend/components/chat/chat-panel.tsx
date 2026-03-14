"use client";

import { FormEvent, useState } from "react";

import type { ChatAskResponse, RepositoryRecord } from "@/lib/types";

type ChatPanelProps = {
  repositories: RepositoryRecord[];
  selectedRepoId: number | null;
  isAsking: boolean;
  onAsk: (repoId: number, question: string) => Promise<void> | void;
  onSelectRepo: (repoId: number) => void;
  response: ChatAskResponse | null;
  historyCount: number;
};

const presetQuestions = [
  "这个仓库的主入口和核心模块分工分别在哪里？",
  "索引和问答链路是怎么串起来的？关键接口在哪些文件？",
  "如果现在要排查一个 bug，最值得优先看的文件有哪些？",
];

export function ChatPanel({
  repositories,
  selectedRepoId,
  isAsking,
  onAsk,
  onSelectRepo,
  response,
  historyCount,
}: ChatPanelProps) {
  const availableRepositories = repositories.filter(
    (repository) => Boolean(repository.root_path) && repository.status === "ready",
  );

  const [question, setQuestion] = useState(
    "这个仓库现在的索引流程是怎么工作的？关键入口在哪里？",
  );

  const selectedRepository =
    availableRepositories.find((repository) => repository.id === selectedRepoId) ??
    availableRepositories[0] ??
    null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRepository) {
      return;
    }
    await onAsk(selectedRepository.id, question.trim());
  }

  return (
    <section className="panel-card">
      <h2 className="panel-title">问答主链路</h2>
      <p className="panel-copy">
        这一版已经接入受控工具链。你可以围绕一个已完成索引、且拥有可用工作区的仓库发问，让 Agent 先检索、再回答，并返回引用与调用摘要。
      </p>

      {availableRepositories.length === 0 ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">
            先登记并索引一个仓库，问答能力才会启用。
          </div>
        </div>
      ) : (
        <form className="field-grid" onSubmit={handleSubmit}>
          <div className="focus-card">
            <div className="focus-card-label">当前问答仓库</div>
            <div className="focus-card-title">{selectedRepository?.name ?? "未选择仓库"}</div>
            <div className="focus-card-copy">
              {selectedRepository?.root_path ?? selectedRepository?.source_url ?? "请先选择一个仓库。"}
            </div>
            <div className="meta-pill-row">
              <span className="meta-pill">
                {selectedRepository?.primary_language ?? "language unknown"}
              </span>
              <span className="meta-pill">{historyCount} 条会话历史</span>
            </div>
          </div>

          <label className="field-label">
            选择仓库
            <select
              onChange={(event) => onSelectRepo(Number(event.target.value))}
              value={selectedRepository?.id ?? ""}
            >
              {availableRepositories.map((repository) => (
                <option key={repository.id} value={repository.id}>
                  {repository.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            你的问题
            <textarea
              className="textarea-input"
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              value={question}
            />
          </label>

          <div className="preset-row">
            {presetQuestions.map((preset) => (
              <button
                className="button-secondary preset-chip"
                key={preset}
                onClick={() => setQuestion(preset)}
                type="button"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="button-row">
            <button
              className="button-primary"
              disabled={isAsking || !selectedRepository || !question.trim()}
              type="submit"
            >
              {isAsking ? "分析中..." : "发起问答"}
            </button>
          </div>
        </form>
      )}

      {response ? (
        <div className="answer-card">
          <div className="answer-header">
            <div className="answer-label">Agent 回答</div>
            <div className="meta-pill-row">
              <span className="meta-pill">session {response.session_id.slice(0, 8)}</span>
              <span className="meta-pill">{response.citations.length} 条引用</span>
              <span className="meta-pill">
                {response.trace_summary.tool_call_count} 个工具步骤
              </span>
            </div>
          </div>
          <pre className="answer-body">{response.answer}</pre>
        </div>
      ) : null}
    </section>
  );
}

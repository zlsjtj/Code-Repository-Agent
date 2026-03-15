"use client";

import { FormEvent, useEffect, useState } from "react";

import type { ChatAskResponse, RepositoryRecord } from "@/lib/types";
import {
  formatRepositoryStatus,
  getWorkspaceCopy,
  type WorkspaceLocale,
} from "@/lib/workspace-i18n";

type ChatPanelProps = {
  repositories: RepositoryRecord[];
  selectedRepoId: number | null;
  isAsking: boolean;
  locale: WorkspaceLocale;
  onAsk: (repoId: number, question: string) => Promise<void> | void;
  onOpenPatch: () => void;
  onOpenChecks: () => void;
  onSelectRepo: (repoId: number) => void;
  response: ChatAskResponse | null;
  historyCount: number;
};

export function ChatPanel({
  repositories,
  selectedRepoId,
  isAsking,
  locale,
  onAsk,
  onOpenPatch,
  onOpenChecks,
  onSelectRepo,
  response,
  historyCount,
}: ChatPanelProps) {
  const copy = getWorkspaceCopy(locale);
  const actionCopy =
    locale === "zh-CN"
      ? {
          patch: "基于这次回答起草改动",
          checks: "查看检查面板",
        }
      : {
          patch: "Draft a patch from this answer",
          checks: "Open checks",
        };
  const availableRepositories = repositories.filter(
    (repository) => Boolean(repository.root_path) && repository.status === "ready",
  );
  const [question, setQuestion] = useState(copy.chat.defaultQuestion);

  useEffect(() => {
    setQuestion(copy.chat.defaultQuestion);
  }, [copy.chat.defaultQuestion]);

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
      <h2 className="panel-title">{copy.chat.title}</h2>
      <p className="panel-copy">{copy.chat.description}</p>

      {availableRepositories.length === 0 ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">{copy.chat.empty}</div>
        </div>
      ) : (
        <form className="field-grid" onSubmit={handleSubmit}>
          <div className="focus-card">
            <div className="focus-card-label">{copy.chat.currentRepository}</div>
            <div className="focus-card-title">
              {selectedRepository?.name ?? copy.chat.repositoryPlaceholder}
            </div>
            <div className="focus-card-copy">
              {selectedRepository?.root_path ?? selectedRepository?.source_url ?? copy.chat.repositoryPlaceholder}
            </div>
            <div className="meta-pill-row">
              <span className="meta-pill">
                {selectedRepository?.primary_language ?? copy.workspace.unknown}
              </span>
              <span className="meta-pill">
                {selectedRepository
                  ? formatRepositoryStatus(locale, selectedRepository.status)
                  : copy.workspace.notSelected}
              </span>
              <span className="meta-pill">
                {historyCount} {copy.chat.historyCount}
              </span>
            </div>
          </div>

          <label className="field-label">
            {copy.chat.repositoryLabel}
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
            {copy.chat.questionLabel}
            <textarea
              className="textarea-input"
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              value={question}
            />
          </label>

          <div className="preset-row">
            {copy.chat.presetQuestions.map((preset) => (
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
              {isAsking ? copy.chat.submitting : copy.chat.submit}
            </button>
          </div>
        </form>
      )}

      {response ? (
        <div className="answer-card">
          <div className="answer-header">
            <div className="answer-label">{copy.chat.answerTitle}</div>
            <div className="meta-pill-row">
              <span className="meta-pill">
                {copy.chat.session} {response.session_id.slice(0, 8)}
              </span>
              <span className="meta-pill">
                {response.citations.length} {copy.chat.citationCount}
              </span>
              <span className="meta-pill">
                {response.trace_summary.tool_call_count} {copy.chat.toolCount}
              </span>
            </div>
          </div>
          <pre className="answer-body">{response.answer}</pre>
          <div className="button-row top-gap">
            <button className="button-primary" onClick={onOpenPatch} type="button">
              {actionCopy.patch}
            </button>
            <button className="button-secondary" onClick={onOpenChecks} type="button">
              {actionCopy.checks}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

import { useMemo, useState } from "react";

import type { RepositoryRecord } from "@/lib/types";
import {
  formatRepositorySource,
  formatRepositoryStatus,
  getWorkspaceCopy,
  type WorkspaceLocale,
} from "@/lib/workspace-i18n";

type RepositoryListProps = {
  repositories: RepositoryRecord[];
  isLoading: boolean;
  importingRepoId: number | null;
  indexingRepoId: number | null;
  selectedRepoId: number | null;
  locale: WorkspaceLocale;
  onIndex: (repoId: number) => Promise<void> | void;
  onSelect: (repoId: number) => void;
};

type RepositoryFilter = "all" | "ready" | "local" | "github";

function getRepositoryStatusHint(locale: WorkspaceLocale, repository: RepositoryRecord): string {
  if (locale === "zh-CN") {
    if (repository.status === "cloning") return "正在准备工作区，完成后即可索引。";
    if (repository.status === "indexing") return "正在建立索引，暂时不适合问答或改动。";
    if (repository.status === "ready") return "已可用于问答、Patch 草案和检查。";
    if (repository.status === "failed") return "最近一次流程失败，建议查看任务面板。";
    return repository.root_path ? "工作区已就绪，下一步建议开始索引。" : "等待可用工作区。";
  }

  if (repository.status === "cloning") return "Workspace is being prepared. Indexing can start after cloning.";
  if (repository.status === "indexing") return "Indexing is running. Wait before chat or patch work.";
  if (repository.status === "ready") return "Ready for Q&A, patch drafts, and checks.";
  if (repository.status === "failed") return "A recent workflow failed. Check the job panel for details.";
  return repository.root_path ? "Workspace is available. Indexing is the next step." : "Waiting for a usable workspace.";
}

export function RepositoryList({
  repositories,
  isLoading,
  importingRepoId,
  indexingRepoId,
  locale,
  selectedRepoId,
  onIndex,
  onSelect,
}: RepositoryListProps) {
  const copy = getWorkspaceCopy(locale);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RepositoryFilter>("all");
  const uiCopy =
    locale === "zh-CN"
      ? {
          searchPlaceholder: "搜索仓库",
          all: "全部",
          ready: "仅可用",
          local: "本地",
          github: "GitHub",
          current: "当前",
          pathLabel: "路径",
          branchLabel: "分支",
          statusHintLabel: "状态说明",
          useRepo: "切换到该仓库",
          indexNow: "开始索引",
          busy: "处理中",
        }
      : {
          searchPlaceholder: "Search repositories",
          all: "All",
          ready: "Ready",
          local: "Local",
          github: "GitHub",
          current: "Current",
          pathLabel: "Path",
          branchLabel: "Branch",
          statusHintLabel: "Status",
          useRepo: "Use repository",
          indexNow: "Index now",
          busy: "Busy",
        };

  const filteredRepositories = useMemo(() => {
    return repositories.filter((repository) => {
      const matchesQuery =
        query.trim().length === 0 ||
        repository.name.toLowerCase().includes(query.toLowerCase()) ||
        (repository.root_path ?? repository.source_url ?? "").toLowerCase().includes(query.toLowerCase());

      if (!matchesQuery) {
        return false;
      }

      if (filter === "ready") {
        return repository.status === "ready";
      }
      if (filter === "local") {
        return repository.source_type === "local";
      }
      if (filter === "github") {
        return repository.source_type === "github";
      }
      return true;
    });
  }, [filter, query, repositories]);

  return (
    <section className="panel-card">
      <h2 className="panel-title">{copy.repositoryList.title}</h2>
      <p className="panel-copy">{copy.repositoryList.description}</p>

      <div className="repo-toolbar">
        <input
          className="repo-search-input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={uiCopy.searchPlaceholder}
          value={query}
        />
        <div className="job-filter-row">
          {([
            ["all", uiCopy.all],
            ["ready", uiCopy.ready],
            ["local", uiCopy.local],
            ["github", uiCopy.github],
          ] as const).map(([value, label]) => (
            <button
              className={`button-secondary compact-button ${filter === value ? "is-active-filter" : ""}`.trim()}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredRepositories.length === 0 ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">
            {repositories.length === 0
              ? isLoading
                ? copy.repositoryList.emptyLoading
                : copy.repositoryList.emptyIdle
              : locale === "zh-CN"
                ? "没有符合当前筛选条件的仓库。"
                : "No repositories match the current filters."}
          </div>
        </div>
      ) : (
        <div className="repo-list repo-list-compact">
          {filteredRepositories.map((repository) => {
            const isSelected = repository.id === selectedRepoId;
            const canIndex = Boolean(repository.root_path) && repository.status !== "cloning";
            const isBusy = importingRepoId === repository.id || indexingRepoId === repository.id;

            return (
              <article
                className={`repo-item repo-item-compact ${isSelected ? "is-selected is-current-repository" : ""}`.trim()}
                key={repository.id}
              >
                <div className="repo-item-accent" aria-hidden="true" />
                <div className="repo-item-content">
                  <div className="repo-header repo-header-compact">
                    <div className="repo-title-stack">
                      <div className="repo-title-row">
                        <div className="repo-title">{repository.name}</div>
                        {isSelected ? <span className="repo-current-badge">{uiCopy.current}</span> : null}
                      </div>
                      <div className="repo-meta">
                        {formatRepositorySource(locale, repository.source_type)}
                        {repository.primary_language ? ` · ${repository.primary_language}` : ""}
                        {repository.default_branch ? ` · ${uiCopy.branchLabel}: ${repository.default_branch}` : ""}
                      </div>
                    </div>
                    <span className="status-pill">{formatRepositoryStatus(locale, repository.status)}</span>
                  </div>

                  <div className="repo-secondary-row">
                    <div className="repo-inline-meta">
                      <span className="repo-inline-label">{uiCopy.pathLabel}</span>
                      <span className="repo-inline-value" title={repository.root_path ?? repository.source_url ?? ""}>
                        {repository.root_path ?? repository.source_url}
                      </span>
                    </div>
                  </div>

                  <div className="repo-status-hint">
                    <span className="repo-inline-label">{uiCopy.statusHintLabel}</span>
                    <span>{getRepositoryStatusHint(locale, repository)}</span>
                  </div>

                  <div className="repo-action-row">
                    <button className="button-secondary compact-button" onClick={() => onSelect(repository.id)} type="button">
                      {isSelected ? copy.repositoryList.currentRepository : uiCopy.useRepo}
                    </button>
                    <button
                      className="button-secondary compact-button"
                      disabled={!canIndex || isBusy}
                      onClick={() => onIndex(repository.id)}
                      type="button"
                    >
                      {importingRepoId === repository.id || repository.status === "cloning"
                        ? copy.repositoryList.cloning
                        : indexingRepoId === repository.id || repository.status === "indexing"
                          ? copy.repositoryList.indexing
                          : !repository.root_path
                            ? copy.repositoryList.missingWorkspace
                            : uiCopy.indexNow}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

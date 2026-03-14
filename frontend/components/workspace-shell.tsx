"use client";

import { startTransition, useEffect, useState } from "react";

import { ChatHistoryPanel } from "@/components/chat/chat-history-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CitationPanel } from "@/components/citations/citation-panel";
import { RepositoryImportForm } from "@/components/repositories/repository-import-form";
import { RepositoryList } from "@/components/repositories/repository-list";
import {
  askRepositoryQuestion,
  createRepository,
  fetchHealth,
  fetchMeta,
  indexRepository,
  listRepositories,
} from "@/lib/api";
import type {
  ChatAskResponse,
  HealthResponse,
  MetaResponse,
  RepositoryCreatePayload,
  RepositoryIndexResponse,
  RepositoryRecord,
  WorkspaceChatEntry,
} from "@/lib/types";

export function WorkspaceShell() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [repositories, setRepositories] = useState<RepositoryRecord[]>([]);
  const [chatResponse, setChatResponse] = useState<ChatAskResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<WorkspaceChatEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [indexingRepoId, setIndexingRepoId] = useState<number | null>(null);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      try {
        setIsLoading(true);
        setError(null);
        const [healthResponse, metaResponse, repositoriesResponse] = await Promise.all([
          fetchHealth(),
          fetchMeta(),
          listRepositories(),
        ]);

        if (!active) {
          return;
        }

        startTransition(() => {
          setHealth(healthResponse);
          setMeta(metaResponse);
          setRepositories(repositoriesResponse.items);
        });
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load the backend workspace.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (repositories.length === 0) {
      setSelectedRepoId(null);
      return;
    }

    setSelectedRepoId((current) => {
      if (current && repositories.some((repository) => repository.id === current)) {
        return current;
      }

      const preferredRepository = repositories.find(
        (repository) => repository.source_type === "local" && repository.status === "ready",
      );
      return preferredRepository?.id ?? repositories[0].id;
    });
  }, [repositories]);

  const readyRepositories = repositories.filter(
    (repository) => repository.source_type === "local" && repository.status === "ready",
  );
  const selectedRepository =
    repositories.find((repository) => repository.id === selectedRepoId) ?? null;
  const citedSessionCount = chatHistory.filter((entry) => entry.response.citations.length > 0).length;

  async function handleRepositorySubmit(payload: RepositoryCreatePayload) {
    setIsSubmitting(true);
    setError(null);
    setStatusMessage(null);

    try {
      const created = await createRepository(payload);
      startTransition(() => {
        setRepositories((current) => [created, ...current]);
      });
      setSelectedRepoId(created.id);
      setStatusMessage(`已登记仓库：${created.name}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to register the repository.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function refreshRepositories() {
    const repositoriesResponse = await listRepositories();
    startTransition(() => {
      setRepositories(repositoriesResponse.items);
    });
  }

  async function handleIndexRepository(repoId: number) {
    let summary: RepositoryIndexResponse;

    setIndexingRepoId(repoId);
    setError(null);
    setStatusMessage(null);

    try {
      summary = await indexRepository(repoId);
      await refreshRepositories();
      setStatusMessage(summary.message);
    } catch (indexError) {
      setError(indexError instanceof Error ? indexError.message : "Unable to index the repository.");
    } finally {
      setIndexingRepoId(null);
    }
  }

  async function handleAsk(repoId: number, question: string) {
    setIsAsking(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await askRepositoryQuestion({ repo_id: repoId, question });
      const repository = repositories.find((item) => item.id === repoId);
      setChatResponse(response);
      setSelectedRepoId(repoId);
      setChatHistory((current) => [
        {
          asked_at: new Date().toISOString(),
          question,
          repository_id: repoId,
          repository_language: repository?.primary_language ?? null,
          repository_name: repository?.name ?? `Repository #${repoId}`,
          response,
          session_id: response.session_id,
        },
        ...current.filter((entry) => entry.session_id !== response.session_id),
      ].slice(0, 8));
      setStatusMessage("问答已完成，下面可以查看引用和工具调用摘要。");
    } catch (askError) {
      setError(askError instanceof Error ? askError.message : "Unable to ask the repository question.");
    } finally {
      setIsAsking(false);
    }
  }

  function handleSelectHistory(entry: WorkspaceChatEntry) {
    setSelectedRepoId(entry.repository_id);
    setChatResponse(entry.response);
    setStatusMessage(`已切换到历史会话：${entry.repository_name}`);
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Stage 5 Workspace</p>
        <h1 className="hero-title">代码库问答与改动助手</h1>
        <p className="hero-copy">
          当前阶段已经接入 OpenAI Agents SDK，并把仓库上下文、问答结果、引用证据和最近会话整理进一个连续工作台，便于我们围绕同一份代码库持续分析。
        </p>
        <div className="hero-badges">
          {meta?.features?.map((feature) => (
            <span className="signal-pill" key={feature}>
              {feature}
            </span>
          )) ?? null}
        </div>
        <div className="hero-grid">
          <div className="hero-stat">
            <div className="hero-stat-label">Backend</div>
            <div className="hero-stat-value">{health?.status === "ok" ? "Healthy" : "Waiting"}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Ready Repos</div>
            <div className="hero-stat-value">{readyRepositories.length}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Cited Sessions</div>
            <div className="hero-stat-value">{citedSessionCount}</div>
          </div>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {statusMessage ? <div className="success-banner">{statusMessage}</div> : null}

      <section className="workspace-grid">
        <div className="panel-stack">
          <RepositoryImportForm
            isSubmitting={isSubmitting}
            onSubmit={handleRepositorySubmit}
          />
          <RepositoryList
            isLoading={isLoading}
            indexingRepoId={indexingRepoId}
            onIndex={handleIndexRepository}
            onSelect={setSelectedRepoId}
            repositories={repositories}
            selectedRepoId={selectedRepoId}
          />
          <ChatHistoryPanel
            activeSessionId={chatResponse?.session_id ?? null}
            entries={chatHistory}
            onSelectSession={handleSelectHistory}
          />
        </div>
        <div className="panel-stack">
          <section className="panel-card">
            <h2 className="panel-title">工作台状态</h2>
            <p className="panel-copy">
              前端会在加载时探测后端状态，并把当前聚焦仓库、能力开关和版本信息放到同一层视图里，减少来回确认的成本。
            </p>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">应用名称</div>
                <div className="summary-value">{meta?.app_name ?? "Loading..."}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">版本</div>
                <div className="summary-value">{meta?.version ?? "Loading..."}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">当前仓库</div>
                <div className="summary-value">{selectedRepository?.name ?? "尚未选择"}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">最近会话</div>
                <div className="summary-value">{chatHistory.length}</div>
              </div>
            </div>
            <div className="focus-card workspace-focus-card">
              <div className="focus-card-label">仓库上下文</div>
              <div className="focus-card-title">{selectedRepository?.name ?? "等待选择仓库"}</div>
              <div className="focus-card-copy">
                {selectedRepository
                  ? selectedRepository.root_path ?? selectedRepository.source_url ?? "无可展示路径"
                  : "先从左侧仓库列表里选择一个上下文，或者登记新的本地仓库。"}
              </div>
              <div className="meta-pill-row">
                <span className="meta-pill">
                  {selectedRepository?.primary_language ?? "language unknown"}
                </span>
                <span className="meta-pill">
                  {selectedRepository?.status ?? "not-selected"}
                </span>
                <span className="meta-pill inline-code">
                  {meta?.features?.join(" · ") ?? "Loading..."}
                </span>
              </div>
            </div>
          </section>
          <ChatPanel
            historyCount={chatHistory.length}
            isAsking={isAsking}
            onAsk={handleAsk}
            onSelectRepo={setSelectedRepoId}
            repositories={repositories}
            response={chatResponse}
            selectedRepoId={selectedRepoId}
          />
          <CitationPanel response={chatResponse} />
        </div>
      </section>
    </main>
  );
}

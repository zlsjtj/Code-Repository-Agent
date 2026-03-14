"use client";

import { startTransition, useEffect, useState } from "react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { CitationPanel } from "@/components/citations/citation-panel";
import { RepositoryImportForm } from "@/components/repositories/repository-import-form";
import { RepositoryList } from "@/components/repositories/repository-list";
import { createRepository, fetchHealth, fetchMeta, indexRepository, listRepositories } from "@/lib/api";
import type {
  HealthResponse,
  MetaResponse,
  RepositoryCreatePayload,
  RepositoryIndexResponse,
  RepositoryRecord,
} from "@/lib/types";

export function WorkspaceShell() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [repositories, setRepositories] = useState<RepositoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [indexingRepoId, setIndexingRepoId] = useState<number | null>(null);

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

  async function handleRepositorySubmit(payload: RepositoryCreatePayload) {
    setIsSubmitting(true);
    setError(null);
    setStatusMessage(null);

    try {
      const created = await createRepository(payload);
      startTransition(() => {
        setRepositories((current) => [created, ...current]);
      });
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

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Stage 2 MVP</p>
        <h1 className="hero-title">代码库问答与改动助手</h1>
        <p className="hero-copy">
          当前阶段已经能登记仓库、查看健康状态并触发基础索引。后端会扫描文本文件、过滤常见无关目录和二进制文件，再把代码切成可追踪的行段 chunk，为后续检索和 Agent 工具调用打基础。
        </p>
        <div className="hero-grid">
          <div className="hero-stat">
            <div className="hero-stat-label">Backend</div>
            <div className="hero-stat-value">{health?.status === "ok" ? "Healthy" : "Waiting"}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Registered Repos</div>
            <div className="hero-stat-value">{repositories.length}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Reserved Modules</div>
            <div className="hero-stat-value">agents / tools online next</div>
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
            repositories={repositories}
          />
        </div>
        <div className="panel-stack">
          <section className="panel-card">
            <h2 className="panel-title">运行状态</h2>
            <p className="panel-copy">前端会在加载时探测后端健康状态和基础能力开关，确认第一阶段工作台可用。</p>
            <div className="status-grid">
              <div className="status-card">
                <div className="status-label">应用名称</div>
                <div className="status-value">{meta?.app_name ?? "Loading..."}</div>
              </div>
              <div className="status-card">
                <div className="status-label">版本</div>
                <div className="status-value">{meta?.version ?? "Loading..."}</div>
              </div>
              <div className="status-card">
                <div className="status-label">能力开关</div>
                <div className="status-value inline-code">
                  {meta?.features.join(", ") ?? "Loading..."}
                </div>
              </div>
            </div>
          </section>
          <ChatPanel />
          <CitationPanel />
        </div>
      </section>
    </main>
  );
}

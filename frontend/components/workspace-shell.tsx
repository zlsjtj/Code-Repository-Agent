"use client";

import { startTransition, useEffect, useState } from "react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { CitationPanel } from "@/components/citations/citation-panel";
import { RepositoryImportForm } from "@/components/repositories/repository-import-form";
import { RepositoryList } from "@/components/repositories/repository-list";
import { createRepository, fetchHealth, fetchMeta, listRepositories } from "@/lib/api";
import type {
  HealthResponse,
  MetaResponse,
  RepositoryCreatePayload,
  RepositoryRecord,
} from "@/lib/types";

export function WorkspaceShell() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [repositories, setRepositories] = useState<RepositoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    try {
      const created = await createRepository(payload);
      startTransition(() => {
        setRepositories((current) => [created, ...current]);
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to register the repository.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Stage 1 MVP</p>
        <h1 className="hero-title">代码库问答与改动助手</h1>
        <p className="hero-copy">
          当前阶段先把项目骨架搭稳：FastAPI、Next.js、SQLite schema、健康检查和仓库导入占位接口已经连通，后续再逐步加入索引、工具调用和 Agent 问答主流程。
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
            <div className="hero-stat-value">agents / tools / indexing</div>
          </div>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="workspace-grid">
        <div className="panel-stack">
          <RepositoryImportForm
            isSubmitting={isSubmitting}
            onSubmit={handleRepositorySubmit}
          />
          <RepositoryList
            isLoading={isLoading}
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

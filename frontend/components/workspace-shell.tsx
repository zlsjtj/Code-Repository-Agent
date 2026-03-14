"use client";

import { startTransition, useEffect, useState } from "react";

import { ChecksPanel } from "@/components/checks/checks-panel";
import { ChatHistoryPanel } from "@/components/chat/chat-history-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CitationPanel } from "@/components/citations/citation-panel";
import { PatchDraftPanel } from "@/components/patches/patch-draft-panel";
import { RepositoryImportForm } from "@/components/repositories/repository-import-form";
import { RepositoryList } from "@/components/repositories/repository-list";
import {
  applyPatchBatchAndRunChecks,
  applyPatchDraftBatch,
  applyPatchAndRunChecks,
  applyPatchDraft,
  askRepositoryQuestion,
  createPatchDraftBatch,
  createPatchDraft,
  createRepository,
  fetchCheckProfiles,
  fetchRecommendedChecks,
  fetchHealth,
  fetchMeta,
  indexRepository,
  listRepositories,
  runRepositoryChecks,
} from "@/lib/api";
import type {
  CheckProfile,
  CheckRecommendationResponse,
  CheckRunResponse,
  ChatAskResponse,
  HealthResponse,
  MetaResponse,
  PatchDraftFile,
  PatchBatchApplyAndCheckResponse,
  PatchBatchApplyResponse,
  PatchBatchDraftResponse,
  PatchApplyAndCheckResponse,
  PatchApplyResponse,
  PatchDraftResponse,
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
  const [patchResponse, setPatchResponse] = useState<PatchDraftResponse | null>(null);
  const [patchBatchResponse, setPatchBatchResponse] = useState<PatchBatchDraftResponse | null>(null);
  const [patchApplyResponse, setPatchApplyResponse] = useState<PatchApplyResponse | null>(null);
  const [patchBatchApplyResponse, setPatchBatchApplyResponse] = useState<PatchBatchApplyResponse | null>(null);
  const [checkProfiles, setCheckProfiles] = useState<CheckProfile[]>([]);
  const [checkRecommendation, setCheckRecommendation] = useState<CheckRecommendationResponse | null>(null);
  const [checkResponse, setCheckResponse] = useState<CheckRunResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<WorkspaceChatEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCheckProfiles, setIsLoadingCheckProfiles] = useState(false);
  const [isLoadingCheckRecommendation, setIsLoadingCheckRecommendation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isDraftingPatch, setIsDraftingPatch] = useState(false);
  const [isApplyingPatch, setIsApplyingPatch] = useState(false);
  const [isApplyingBatchPatch, setIsApplyingBatchPatch] = useState(false);
  const [isApplyingAndChecking, setIsApplyingAndChecking] = useState(false);
  const [isApplyingBatchAndChecking, setIsApplyingBatchAndChecking] = useState(false);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [indexingRepoId, setIndexingRepoId] = useState<number | null>(null);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [activeChatRepoId, setActiveChatRepoId] = useState<number | null>(null);

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
  const suggestedPatchPath =
    activeChatRepoId === selectedRepoId ? chatResponse?.citations[0]?.path ?? null : null;

  useEffect(() => {
    setPatchResponse((current) => {
      if (!current) {
        return current;
      }
      return current.repo_id === selectedRepoId ? current : null;
    });
    setPatchBatchResponse((current) => {
      if (!current) {
        return current;
      }
      return current.repo_id === selectedRepoId ? current : null;
    });
    setPatchApplyResponse((current) => {
      if (!current) {
        return current;
      }
      return current.repo_id === selectedRepoId ? current : null;
    });
    setPatchBatchApplyResponse((current) => {
      if (!current) {
        return current;
      }
      return current.repo_id === selectedRepoId ? current : null;
    });
    setCheckResponse((current) => {
      if (!current) {
        return current;
      }
      return current.repo_id === selectedRepoId ? current : null;
    });
    setCheckRecommendation((current) => {
      if (!current) {
        return current;
      }
      return current.repo_id === selectedRepoId ? current : null;
    });
  }, [selectedRepoId]);

  useEffect(() => {
    let active = true;

    async function loadCheckProfiles() {
      if (!selectedRepository || selectedRepository.source_type !== "local") {
        startTransition(() => {
          setCheckProfiles([]);
        });
        return;
      }

      try {
        setIsLoadingCheckProfiles(true);
        const response = await fetchCheckProfiles(selectedRepository.id);
        if (!active) {
          return;
        }
        startTransition(() => {
          setCheckProfiles(response.items);
        });
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load available checks.");
      } finally {
        if (active) {
          setIsLoadingCheckProfiles(false);
        }
      }
    }

    void loadCheckProfiles();
    return () => {
      active = false;
    };
  }, [selectedRepository]);

  useEffect(() => {
    let active = true;

    async function loadCheckRecommendation() {
      const changedPaths =
        patchBatchResponse && patchBatchResponse.repo_id === selectedRepository?.id
          ? patchBatchResponse.target_paths
          : patchResponse && patchResponse.repo_id === selectedRepository?.id
            ? [patchResponse.target_path]
            : null;

      if (
        !selectedRepository ||
        selectedRepository.source_type !== "local" ||
        !changedPaths ||
        changedPaths.length === 0
      ) {
        startTransition(() => {
          setCheckRecommendation(null);
        });
        return;
      }

      try {
        setIsLoadingCheckRecommendation(true);
        const response = await fetchRecommendedChecks({
          changed_paths: changedPaths,
          repo_id: selectedRepository.id,
        });
        if (!active) {
          return;
        }
        startTransition(() => {
          setCheckRecommendation(response);
        });
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load recommended checks.");
      } finally {
        if (active) {
          setIsLoadingCheckRecommendation(false);
        }
      }
    }

    void loadCheckRecommendation();
    return () => {
      active = false;
    };
  }, [patchBatchResponse, patchResponse, selectedRepository]);

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
      setActiveChatRepoId(repoId);
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

  async function handleDraftPatch(repoId: number, targetPaths: string[], instruction: string) {
    const normalizedTargetPaths = targetPaths
      .map((targetPath) => targetPath.trim())
      .filter((targetPath) => targetPath.length > 0);

    if (normalizedTargetPaths.length === 0) {
      return;
    }

    setIsDraftingPatch(true);
    setError(null);
    setStatusMessage(null);

    try {
      if (normalizedTargetPaths.length === 1) {
        const response = await createPatchDraft({
          instruction,
          repo_id: repoId,
          target_path: normalizedTargetPaths[0],
        });
        setPatchResponse(response);
        setPatchBatchResponse(null);
        setStatusMessage(`patch 草案已生成：${response.target_path}`);
      } else {
        const response = await createPatchDraftBatch({
          instruction,
          repo_id: repoId,
          target_paths: normalizedTargetPaths,
        });
        setPatchBatchResponse(response);
        setPatchResponse(null);
        setStatusMessage(`已生成 ${response.changed_file_count} 个文件的 patch 草案。`);
      }

      setPatchApplyResponse(null);
      setPatchBatchApplyResponse(null);
      setCheckRecommendation(null);
      setCheckResponse(null);
      setSelectedRepoId(repoId);
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : "Unable to draft the patch.");
    } finally {
      setIsDraftingPatch(false);
    }
  }

  async function handleApplyPatchAndRunChecks(draft: PatchDraftResponse) {
    setIsApplyingAndChecking(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response: PatchApplyAndCheckResponse = await applyPatchAndRunChecks({
        expected_base_sha256: draft.base_content_sha256,
        profile_ids:
          checkRecommendation && checkRecommendation.items.length > 0
            ? checkRecommendation.items.map((item) => item.id)
            : undefined,
        proposed_content: draft.proposed_content,
        repo_id: draft.repo_id,
        target_path: draft.target_path,
      });
      setPatchApplyResponse(response.patch);
      setCheckResponse(response.checks);
      setStatusMessage(`patch 已写入并完成检查：${response.checks.summary}`);
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Unable to apply and verify the patch.");
    } finally {
      setIsApplyingAndChecking(false);
    }
  }

  async function handleApplyPatch(draft: PatchDraftResponse) {
    setIsApplyingPatch(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await applyPatchDraft({
        expected_base_sha256: draft.base_content_sha256,
        proposed_content: draft.proposed_content,
        repo_id: draft.repo_id,
        target_path: draft.target_path,
      });
      setPatchApplyResponse(response);
      setStatusMessage(`patch 已写入工作区：${response.target_path}`);
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Unable to apply the patch.");
    } finally {
      setIsApplyingPatch(false);
    }
  }

  async function handleApplyPatchBatch(repoId: number, drafts: PatchDraftFile[]) {
    if (drafts.length === 0) {
      return;
    }

    setIsApplyingBatchPatch(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await applyPatchDraftBatch({
        items: drafts.map((draft) => ({
          expected_base_sha256: draft.base_content_sha256,
          proposed_content: draft.proposed_content,
          target_path: draft.target_path,
        })),
        repo_id: repoId,
      });
      setPatchApplyResponse(null);
      setPatchBatchApplyResponse(response);
      setStatusMessage(`批量 patch 已完成：${response.message}`);
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Unable to apply the batch patch.");
    } finally {
      setIsApplyingBatchPatch(false);
    }
  }

  async function handleApplyPatchBatchAndRunChecks(repoId: number, drafts: PatchDraftFile[]) {
    if (drafts.length === 0) {
      return;
    }

    setIsApplyingBatchAndChecking(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response: PatchBatchApplyAndCheckResponse = await applyPatchBatchAndRunChecks({
        items: drafts.map((draft) => ({
          expected_base_sha256: draft.base_content_sha256,
          proposed_content: draft.proposed_content,
          target_path: draft.target_path,
        })),
        profile_ids:
          checkRecommendation && checkRecommendation.items.length > 0
            ? checkRecommendation.items.map((item) => item.id)
            : undefined,
        repo_id: repoId,
      });
      setPatchApplyResponse(null);
      setPatchBatchApplyResponse(response.patch);
      setCheckResponse(response.checks);
      setStatusMessage(`批量 patch 已写入并完成检查：${response.checks.summary}`);
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Unable to apply and verify the batch patch.");
    } finally {
      setIsApplyingBatchAndChecking(false);
    }
  }

  async function handleRunChecks(profileIds?: string[]) {
    if (!selectedRepository) {
      return;
    }

    setIsRunningChecks(true);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await runRepositoryChecks({
        profile_ids: profileIds,
        repo_id: selectedRepository.id,
      });
      setCheckResponse(response);
      setStatusMessage(`检查执行完成：${response.summary}`);
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Unable to run repository checks.");
    } finally {
      setIsRunningChecks(false);
    }
  }

  function handleSelectHistory(entry: WorkspaceChatEntry) {
    setSelectedRepoId(entry.repository_id);
    setActiveChatRepoId(entry.repository_id);
    setChatResponse(entry.response);
    setStatusMessage(`已切换到历史会话：${entry.repository_name}`);
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Stage 12 Multi-File Apply</p>
        <h1 className="hero-title">代码库问答与改动助手</h1>
        <p className="hero-copy">
          当前阶段已经把多文件 patch 从“只预览”推进到了“可逐项确认后安全批量应用”：现在不仅能分组看 diff，还能对选中的文件做 all-or-nothing 写回，并继续挂上推荐 checks 做验证。
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
          <PatchDraftPanel
            applyResponse={patchApplyResponse}
            batchApplyResponse={patchBatchApplyResponse}
            batchResponse={patchBatchResponse}
            isApplying={isApplyingPatch}
            isApplyingBatch={isApplyingBatchPatch}
            isApplyingBatchAndChecking={isApplyingBatchAndChecking}
            isApplyingAndChecking={isApplyingAndChecking}
            isDrafting={isDraftingPatch}
            recommendedCheckCount={checkRecommendation?.items.length ?? 0}
            onApply={handleApplyPatch}
            onApplyBatch={handleApplyPatchBatch}
            onApplyBatchAndCheck={handleApplyPatchBatchAndRunChecks}
            onApplyAndCheck={handleApplyPatchAndRunChecks}
            onDraft={handleDraftPatch}
            response={patchResponse}
            selectedRepository={selectedRepository}
            suggestedPath={suggestedPatchPath}
          />
          <ChecksPanel
            isLoadingProfiles={isLoadingCheckProfiles}
            isLoadingRecommendation={isLoadingCheckRecommendation}
            isRunningChecks={isRunningChecks}
            onRunChecks={handleRunChecks}
            patchApplyResponse={patchApplyResponse}
            profiles={checkProfiles}
            recommendation={checkRecommendation}
            response={checkResponse}
            selectedRepository={selectedRepository}
          />
          <CitationPanel response={chatResponse} />
        </div>
      </section>
    </main>
  );
}

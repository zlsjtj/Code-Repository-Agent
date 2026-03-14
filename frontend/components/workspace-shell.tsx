"use client";

import { useState } from "react";

import { ChecksPanel } from "@/components/checks/checks-panel";
import { ChatHistoryPanel } from "@/components/chat/chat-history-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CitationPanel } from "@/components/citations/citation-panel";
import { PatchDraftPanel } from "@/components/patches/patch-draft-panel";
import { RepositoryImportForm } from "@/components/repositories/repository-import-form";
import { RepositoryList } from "@/components/repositories/repository-list";
import { useChatWorkspace } from "@/lib/hooks/use-chat-workspace";
import { usePatchChecksWorkspace } from "@/lib/hooks/use-patch-checks-workspace";
import { useWorkspaceRepositories } from "@/lib/hooks/use-workspace-repositories";

export function WorkspaceShell() {
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const repositoriesWorkspace = useWorkspaceRepositories({
    setError,
    setStatusMessage,
  });
  const chatWorkspace = useChatWorkspace({
    repositories: repositoriesWorkspace.repositories,
    selectedRepoId: repositoriesWorkspace.selectedRepoId,
    setSelectedRepoId: repositoriesWorkspace.setSelectedRepoId,
    setError,
    setStatusMessage,
  });
  const patchChecksWorkspace = usePatchChecksWorkspace({
    selectedRepoId: repositoriesWorkspace.selectedRepoId,
    selectedRepository: repositoriesWorkspace.selectedRepository,
    setSelectedRepoId: repositoriesWorkspace.setSelectedRepoId,
    setError,
    setStatusMessage,
  });

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Stage 13 GitHub Clone Import</p>
        <h1 className="hero-title">代码库问答与改动助手</h1>
        <p className="hero-copy">
          当前阶段已经把 GitHub 仓库从“只登记元信息”推进到了“clone 后直接进入完整工作流”：
          现在无论仓库来自本地路径还是 GitHub，只要拿到可用工作区，就能继续索引、问答、patch 和 checks。
        </p>
        <div className="hero-badges">
          {repositoriesWorkspace.meta?.features?.map((feature) => (
            <span className="signal-pill" key={feature}>
              {feature}
            </span>
          )) ?? null}
        </div>
        <div className="hero-grid">
          <div className="hero-stat">
            <div className="hero-stat-label">Backend</div>
            <div className="hero-stat-value">
              {repositoriesWorkspace.health?.status === "ok" ? "Healthy" : "Waiting"}
            </div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Ready Repos</div>
            <div className="hero-stat-value">{repositoriesWorkspace.readyRepositories.length}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-label">Cited Sessions</div>
            <div className="hero-stat-value">{chatWorkspace.citedSessionCount}</div>
          </div>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {statusMessage ? <div className="success-banner">{statusMessage}</div> : null}

      <section className="workspace-grid">
        <div className="panel-stack">
          <RepositoryImportForm
            isSubmitting={repositoriesWorkspace.isSubmitting}
            onSubmit={repositoriesWorkspace.handleRepositorySubmit}
          />
          <RepositoryList
            isLoading={repositoriesWorkspace.isLoading}
            indexingRepoId={repositoriesWorkspace.indexingRepoId}
            onIndex={repositoriesWorkspace.handleIndexRepository}
            onSelect={repositoriesWorkspace.setSelectedRepoId}
            repositories={repositoriesWorkspace.repositories}
            selectedRepoId={repositoriesWorkspace.selectedRepoId}
          />
          <ChatHistoryPanel
            activeSessionId={chatWorkspace.chatResponse?.session_id ?? null}
            entries={chatWorkspace.chatHistory}
            onSelectSession={chatWorkspace.handleSelectHistory}
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
                <div className="summary-value">
                  {repositoriesWorkspace.meta?.app_name ?? "Loading..."}
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-label">版本</div>
                <div className="summary-value">
                  {repositoriesWorkspace.meta?.version ?? "Loading..."}
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-label">当前仓库</div>
                <div className="summary-value">
                  {repositoriesWorkspace.selectedRepository?.name ?? "尚未选择"}
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-label">最近会话</div>
                <div className="summary-value">{chatWorkspace.chatHistory.length}</div>
              </div>
            </div>
            <div className="focus-card workspace-focus-card">
              <div className="focus-card-label">仓库上下文</div>
              <div className="focus-card-title">
                {repositoriesWorkspace.selectedRepository?.name ?? "等待选择仓库"}
              </div>
              <div className="focus-card-copy">
                {repositoriesWorkspace.selectedRepository
                  ? repositoriesWorkspace.selectedRepository.root_path ??
                    repositoriesWorkspace.selectedRepository.source_url ??
                    "无可展示路径"
                  : "先从左侧仓库列表里选择一个上下文，或者登记新的仓库。"}
              </div>
              <div className="meta-pill-row">
                <span className="meta-pill">
                  {repositoriesWorkspace.selectedRepository?.primary_language ?? "language unknown"}
                </span>
                <span className="meta-pill">
                  {repositoriesWorkspace.selectedRepository?.status ?? "not-selected"}
                </span>
                <span className="meta-pill inline-code">
                  {repositoriesWorkspace.meta?.features?.join(" / ") ?? "Loading..."}
                </span>
              </div>
            </div>
          </section>

          <ChatPanel
            historyCount={chatWorkspace.chatHistory.length}
            isAsking={chatWorkspace.isAsking}
            onAsk={chatWorkspace.handleAsk}
            onSelectRepo={repositoriesWorkspace.setSelectedRepoId}
            repositories={repositoriesWorkspace.repositories}
            response={chatWorkspace.chatResponse}
            selectedRepoId={repositoriesWorkspace.selectedRepoId}
          />

          <PatchDraftPanel
            applyResponse={patchChecksWorkspace.patchApplyResponse}
            batchApplyResponse={patchChecksWorkspace.patchBatchApplyResponse}
            batchResponse={patchChecksWorkspace.patchBatchResponse}
            isApplying={patchChecksWorkspace.isApplyingPatch}
            isApplyingBatch={patchChecksWorkspace.isApplyingBatchPatch}
            isApplyingBatchAndChecking={patchChecksWorkspace.isApplyingBatchAndChecking}
            isApplyingAndChecking={patchChecksWorkspace.isApplyingAndChecking}
            isDrafting={patchChecksWorkspace.isDraftingPatch}
            recommendedCheckCount={patchChecksWorkspace.recommendedCheckCount}
            onApply={patchChecksWorkspace.handleApplyPatch}
            onApplyBatch={patchChecksWorkspace.handleApplyPatchBatch}
            onApplyBatchAndCheck={patchChecksWorkspace.handleApplyPatchBatchAndRunChecks}
            onApplyAndCheck={patchChecksWorkspace.handleApplyPatchAndRunChecks}
            onDraft={patchChecksWorkspace.handleDraftPatch}
            response={patchChecksWorkspace.patchResponse}
            selectedRepository={repositoriesWorkspace.selectedRepository}
            suggestedPath={chatWorkspace.suggestedPatchPath}
          />

          <ChecksPanel
            isLoadingProfiles={patchChecksWorkspace.isLoadingCheckProfiles}
            isLoadingRecommendation={patchChecksWorkspace.isLoadingCheckRecommendation}
            isRunningChecks={patchChecksWorkspace.isRunningChecks}
            onRunChecks={patchChecksWorkspace.handleRunChecks}
            patchApplyResponse={patchChecksWorkspace.patchApplyResponse}
            profiles={patchChecksWorkspace.checkProfiles}
            recommendation={patchChecksWorkspace.checkRecommendation}
            response={patchChecksWorkspace.checkResponse}
            selectedRepository={repositoriesWorkspace.selectedRepository}
          />

          <CitationPanel response={chatWorkspace.chatResponse} />
        </div>
      </section>
    </main>
  );
}

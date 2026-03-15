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

type WorkspaceView = "chat" | "patch" | "checks";

type WorkspaceTab = {
  id: WorkspaceView;
  label: string;
  hint: string;
  count?: number;
};

export function WorkspaceShell() {
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>("chat");

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

  const selectedRepository = repositoriesWorkspace.selectedRepository;
  const citationCount = chatWorkspace.chatResponse?.citations.length ?? 0;
  const checkCount = patchChecksWorkspace.checkProfiles.length;
  const hasChatHistory = chatWorkspace.chatHistory.length > 0;
  const hasChatResponse = Boolean(chatWorkspace.chatResponse);

  const tabs: WorkspaceTab[] = [
    {
      id: "chat",
      label: "Chat",
      hint: "Ask grounded questions and inspect citations.",
      count: hasChatResponse ? citationCount : undefined,
    },
    {
      id: "patch",
      label: "Patch",
      hint: "Draft changes first, then review the diff.",
      count: patchChecksWorkspace.patchBatchResponse?.changed_file_count,
    },
    {
      id: "checks",
      label: "Checks",
      hint: "Run safe lint and test commands.",
      count: checkCount > 0 ? checkCount : undefined,
    },
  ];

  const activeTab = tabs.find((tab) => tab.id === activeView) ?? tabs[0];

  return (
    <main className="page-shell page-shell--workspace">
      <section className="workspace-topbar">
        <div className="workspace-title-block">
          <p className="eyebrow">Repository Workspace</p>
          <h1 className="workspace-title">Code Repository Agent</h1>
          <p className="workspace-subtitle">
            Import a repository, ask evidence-based questions, draft a patch, and run safe
            verification without leaving the same workspace.
          </p>
        </div>
        <div className="workspace-overview">
          <article className="workspace-metric">
            <div className="workspace-metric-label">Backend</div>
            <div className="workspace-metric-value">
              {repositoriesWorkspace.health?.status === "ok" ? "Healthy" : "Waiting"}
            </div>
          </article>
          <article className="workspace-metric">
            <div className="workspace-metric-label">Ready repos</div>
            <div className="workspace-metric-value">{repositoriesWorkspace.readyRepositories.length}</div>
          </article>
          <article className="workspace-metric">
            <div className="workspace-metric-label">Recent sessions</div>
            <div className="workspace-metric-value">{chatWorkspace.chatHistory.length}</div>
          </article>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {statusMessage ? <div className="success-banner">{statusMessage}</div> : null}

      <section className="workspace-layout">
        <aside className="workspace-sidebar">
          <section className="panel-card context-card">
            <div className="context-card-header">
              <div>
                <p className="context-eyebrow">Current repository</p>
                <h2 className="context-title">
                  {selectedRepository?.name ?? "No repository selected"}
                </h2>
              </div>
              <span className={`status-pill ${selectedRepository ? "" : "is-muted"}`.trim()}>
                {selectedRepository?.status ?? "idle"}
              </span>
            </div>
            <p className="context-path">
              {selectedRepository?.root_path ??
                selectedRepository?.source_url ??
                "Select a repository from the list or import a new one to get started."}
            </p>
            <div className="context-meta-grid">
              <div className="context-meta-card">
                <div className="context-meta-label">Language</div>
                <div className="context-meta-value">
                  {selectedRepository?.primary_language ?? "Unknown"}
                </div>
              </div>
              <div className="context-meta-card">
                <div className="context-meta-label">Source</div>
                <div className="context-meta-value">
                  {selectedRepository?.source_type ?? "Not selected"}
                </div>
              </div>
            </div>
            {repositoriesWorkspace.meta?.features?.length ? (
              <div className="hero-badges compact-badges">
                {repositoriesWorkspace.meta.features.map((feature) => (
                  <span className="signal-pill" key={feature}>
                    {feature}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

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
          {hasChatHistory ? (
            <ChatHistoryPanel
              activeSessionId={chatWorkspace.chatResponse?.session_id ?? null}
              entries={chatWorkspace.chatHistory}
              onSelectSession={chatWorkspace.handleSelectHistory}
            />
          ) : null}
        </aside>

        <section className="workspace-main">
          <section className="panel-card stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-copyblock">
                <p className="context-eyebrow">Active stage</p>
                <h2 className="stage-frame-title">{activeTab.label}</h2>
                <p className="stage-frame-copy">{activeTab.hint}</p>
              </div>
              <div className="view-tabs" role="tablist" aria-label="Workspace stages">
                {tabs.map((tab) => (
                  <button
                    aria-selected={tab.id === activeView}
                    className={`view-tab ${tab.id === activeView ? "is-active" : ""}`.trim()}
                    key={tab.id}
                    onClick={() => setActiveView(tab.id)}
                    role="tab"
                    type="button"
                  >
                    <span>{tab.label}</span>
                    {tab.count ? <span className="view-tab-badge">{tab.count}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {activeView === "chat" ? (
            <div
              className={`workspace-stage-grid ${hasChatResponse ? "" : "is-single"}`.trim()}
            >
              <div className="workspace-stage-primary">
                <ChatPanel
                  historyCount={chatWorkspace.chatHistory.length}
                  isAsking={chatWorkspace.isAsking}
                  onAsk={chatWorkspace.handleAsk}
                  onSelectRepo={repositoriesWorkspace.setSelectedRepoId}
                  repositories={repositoriesWorkspace.repositories}
                  response={chatWorkspace.chatResponse}
                  selectedRepoId={repositoriesWorkspace.selectedRepoId}
                />
              </div>
              {hasChatResponse ? (
                <div className="workspace-stage-secondary">
                  <CitationPanel response={chatWorkspace.chatResponse} />
                </div>
              ) : null}
            </div>
          ) : null}

          {activeView === "patch" ? (
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
              selectedRepository={selectedRepository}
              suggestedPath={chatWorkspace.suggestedPatchPath}
            />
          ) : null}

          {activeView === "checks" ? (
            <ChecksPanel
              isLoadingProfiles={patchChecksWorkspace.isLoadingCheckProfiles}
              isLoadingRecommendation={patchChecksWorkspace.isLoadingCheckRecommendation}
              isRunningChecks={patchChecksWorkspace.isRunningChecks}
              onRunChecks={patchChecksWorkspace.handleRunChecks}
              patchApplyResponse={patchChecksWorkspace.patchApplyResponse}
              profiles={patchChecksWorkspace.checkProfiles}
              recommendation={patchChecksWorkspace.checkRecommendation}
              response={patchChecksWorkspace.checkResponse}
              selectedRepository={selectedRepository}
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";

import { ChecksPanel } from "@/components/checks/checks-panel";
import { ChatHistoryPanel } from "@/components/chat/chat-history-panel";
import { ChatPanel } from "@/components/chat/chat-panel";
import { CitationPanel } from "@/components/citations/citation-panel";
import { JobActivityPanel } from "@/components/jobs/job-activity-panel";
import { PatchDraftPanel } from "@/components/patches/patch-draft-panel";
import { RepositoryImportForm } from "@/components/repositories/repository-import-form";
import { RepositoryList } from "@/components/repositories/repository-list";
import { useChatWorkspace } from "@/lib/hooks/use-chat-workspace";
import { usePatchChecksWorkspace } from "@/lib/hooks/use-patch-checks-workspace";
import { useWorkspaceRepositories } from "@/lib/hooks/use-workspace-repositories";
import {
  formatFeature,
  formatHealthStatus,
  formatRepositorySource,
  formatRepositoryStatus,
  getWorkspaceCopy,
  localeOptions,
  type WorkspaceLocale,
} from "@/lib/workspace-i18n";

type WorkspaceView = "chat" | "patch" | "checks";

type WorkspaceTab = {
  id: WorkspaceView;
  label: string;
  hint: string;
  count?: number;
};

export function WorkspaceShell() {
  const [locale, setLocale] = useState<WorkspaceLocale>("zh-CN");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>("chat");
  const copy = getWorkspaceCopy(locale);

  const repositoriesWorkspace = useWorkspaceRepositories({
    locale,
    setError,
    setStatusMessage,
  });
  const chatWorkspace = useChatWorkspace({
    locale,
    repositories: repositoriesWorkspace.repositories,
    selectedRepoId: repositoriesWorkspace.selectedRepoId,
    setSelectedRepoId: repositoriesWorkspace.setSelectedRepoId,
    setError,
    setStatusMessage,
  });
  const patchChecksWorkspace = usePatchChecksWorkspace({
    locale,
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
      label: copy.workspace.tabs.chat.label,
      hint: copy.workspace.tabs.chat.hint,
      count: hasChatResponse ? citationCount : undefined,
    },
    {
      id: "patch",
      label: copy.workspace.tabs.patch.label,
      hint: copy.workspace.tabs.patch.hint,
      count: patchChecksWorkspace.patchBatchResponse?.changed_file_count,
    },
    {
      id: "checks",
      label: copy.workspace.tabs.checks.label,
      hint: copy.workspace.tabs.checks.hint,
      count: checkCount > 0 ? checkCount : undefined,
    },
  ];

  const activeTab = tabs.find((tab) => tab.id === activeView) ?? tabs[0];

  return (
    <main className="page-shell page-shell--workspace">
      <section className="workspace-topbar">
        <div className="workspace-title-block">
          <div className="workspace-title-row">
            <p className="eyebrow">{copy.workspace.eyebrow}</p>
            <label className="locale-switcher">
              <span className="locale-switcher-label">{copy.workspace.localeLabel}</span>
              <div className="locale-switcher-options">
                {localeOptions.map((option) => (
                  <button
                    className={`locale-option ${locale === option.value ? "is-active" : ""}`.trim()}
                    key={option.value}
                    onClick={() => setLocale(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <h1 className="workspace-title">{copy.workspace.title}</h1>
          <p className="workspace-subtitle">{copy.workspace.subtitle}</p>
        </div>
        <div className="workspace-overview">
          <article className="workspace-metric">
            <div className="workspace-metric-label">{copy.workspace.backend}</div>
            <div className="workspace-metric-value">
              {formatHealthStatus(locale, repositoriesWorkspace.health?.status ?? "waiting")}
            </div>
          </article>
          <article className="workspace-metric">
            <div className="workspace-metric-label">{copy.workspace.readyRepos}</div>
            <div className="workspace-metric-value">
              {repositoriesWorkspace.readyRepositories.length}
            </div>
          </article>
          <article className="workspace-metric">
            <div className="workspace-metric-label">{copy.workspace.recentSessions}</div>
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
                <p className="context-eyebrow">{copy.workspace.currentRepository}</p>
                <h2 className="context-title">
                  {selectedRepository?.name ?? copy.workspace.noRepositorySelected}
                </h2>
              </div>
              <span className={`status-pill ${selectedRepository ? "" : "is-muted"}`.trim()}>
                {selectedRepository
                  ? formatRepositoryStatus(locale, selectedRepository.status)
                  : copy.workspace.notSelected}
              </span>
            </div>
            <p className="context-path">
              {selectedRepository?.root_path ??
                selectedRepository?.source_url ??
                copy.workspace.selectRepositoryHint}
            </p>
            <div className="context-meta-grid">
              <div className="context-meta-card">
                <div className="context-meta-label">{copy.workspace.language}</div>
                <div className="context-meta-value">
                  {selectedRepository?.primary_language ?? copy.workspace.unknown}
                </div>
              </div>
              <div className="context-meta-card">
                <div className="context-meta-label">{copy.workspace.source}</div>
                <div className="context-meta-value">
                  {selectedRepository
                    ? formatRepositorySource(locale, selectedRepository.source_type)
                    : copy.workspace.notSelected}
                </div>
              </div>
            </div>
            {repositoriesWorkspace.meta?.features?.length ? (
              <div className="hero-badges compact-badges">
                {repositoriesWorkspace.meta.features.map((feature) => (
                  <span className="signal-pill" key={feature}>
                    {formatFeature(locale, feature)}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <RepositoryImportForm isSubmitting={repositoriesWorkspace.isSubmitting} locale={locale} onSubmit={repositoriesWorkspace.handleRepositorySubmit} />
          <RepositoryList
            importingRepoId={repositoriesWorkspace.importingRepoId}
            indexingRepoId={repositoriesWorkspace.indexingRepoId}
            isLoading={repositoriesWorkspace.isLoading}
            locale={locale}
            onIndex={repositoriesWorkspace.handleIndexRepository}
            onSelect={repositoriesWorkspace.setSelectedRepoId}
            repositories={repositoriesWorkspace.repositories}
            selectedRepoId={repositoriesWorkspace.selectedRepoId}
          />
          <JobActivityPanel
            jobs={repositoriesWorkspace.recentJobs}
            locale={locale}
            onRetry={repositoriesWorkspace.handleRetryJob}
            repositories={repositoriesWorkspace.repositories}
            retryingJobId={repositoriesWorkspace.retryingJobId}
          />
          {hasChatHistory ? (
            <ChatHistoryPanel
              activeSessionId={chatWorkspace.chatResponse?.session_id ?? null}
              entries={chatWorkspace.chatHistory}
              locale={locale}
              onSelectSession={chatWorkspace.handleSelectHistory}
            />
          ) : null}
        </aside>

        <section className="workspace-main">
          <section className="panel-card stage-frame">
            <div className="stage-frame-header">
              <div className="stage-frame-copyblock">
                <p className="context-eyebrow">{copy.workspace.activeStage}</p>
                <h2 className="stage-frame-title">{activeTab.label}</h2>
                <p className="stage-frame-copy">{activeTab.hint}</p>
              </div>
              <div aria-label="Workspace stages" className="view-tabs" role="tablist">
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
            <div className={`workspace-stage-grid ${hasChatResponse ? "" : "is-single"}`.trim()}>
              <div className="workspace-stage-primary">
                <ChatPanel
                  historyCount={chatWorkspace.chatHistory.length}
                  isAsking={chatWorkspace.isAsking}
                  locale={locale}
                  onAsk={chatWorkspace.handleAsk}
                  onSelectRepo={repositoriesWorkspace.setSelectedRepoId}
                  repositories={repositoriesWorkspace.repositories}
                  response={chatWorkspace.chatResponse}
                  selectedRepoId={repositoriesWorkspace.selectedRepoId}
                />
              </div>
              {hasChatResponse ? (
                <div className="workspace-stage-secondary">
                  <CitationPanel locale={locale} response={chatWorkspace.chatResponse} />
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
              isApplyingAndChecking={patchChecksWorkspace.isApplyingAndChecking}
              isApplyingBatch={patchChecksWorkspace.isApplyingBatchPatch}
              isApplyingBatchAndChecking={patchChecksWorkspace.isApplyingBatchAndChecking}
              isDrafting={patchChecksWorkspace.isDraftingPatch}
              locale={locale}
              onApply={patchChecksWorkspace.handleApplyPatch}
              onApplyAndCheck={patchChecksWorkspace.handleApplyPatchAndRunChecks}
              onApplyBatch={patchChecksWorkspace.handleApplyPatchBatch}
              onApplyBatchAndCheck={patchChecksWorkspace.handleApplyPatchBatchAndRunChecks}
              onDraft={patchChecksWorkspace.handleDraftPatch}
              recommendedCheckCount={patchChecksWorkspace.recommendedCheckCount}
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
              locale={locale}
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

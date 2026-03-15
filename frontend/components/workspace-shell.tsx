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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const drawerCopy =
    locale === "zh-CN"
      ? { open: "仓库与任务", close: "关闭侧栏" }
      : { open: "Repos and jobs", close: "Close sidebar" };
  const stageGuideCopy =
    locale === "zh-CN"
      ? {
          label: "建议下一步",
          selectRepo: "先选择一个仓库，工作流才能继续。",
          waitClone: "仓库还在克隆中，完成后就可以开始索引。",
          indexRepo: "这个仓库还没有可用索引，先建立索引再继续问答和改动。",
          indexing: "索引任务已经在跑了，完成后就可以进入问答和改动流程。",
          askQuestion: "仓库已经准备好了，下一步最自然的是先提一个问题缩小范围。",
          reviewPatch: "草案已经生成，建议先审一遍 diff，再决定是否应用或验证。",
          runChecks: "改动已经落到工作区，下一步建议运行检查确认没有破坏现有行为。",
          continueChat: "检查结果已经出来了，可以回到问答继续排查或解释失败原因。",
          openChat: "去问答",
          openPatch: "去改动草案",
          openChecks: "去检查验证",
          startIndex: "开始索引",
        }
      : {
          label: "Suggested next step",
          selectRepo: "Select a repository first so the workflow can continue.",
          waitClone: "This repository is still cloning. Once it finishes, you can index it.",
          indexRepo: "This repository is not indexed yet. Build the index before chat or patch work.",
          indexing:
            "Indexing is already running. When it finishes, the workspace will be ready for chat and patch flows.",
          askQuestion: "This repository is ready. The best next step is usually to ask a focused question.",
          reviewPatch: "A patch draft is ready. Review the diff before you apply or verify it.",
          runChecks: "Changes were written to the workspace. Run checks next to confirm behavior still holds.",
          continueChat: "Checks finished. Return to chat if you want to explain failures or continue debugging.",
          openChat: "Open chat",
          openPatch: "Open patch draft",
          openChecks: "Open checks",
          startIndex: "Start indexing",
        };
  const stageGuide = (() => {
    if (!selectedRepository) {
      return { title: stageGuideCopy.label, body: stageGuideCopy.selectRepo };
    }
    if (selectedRepository.status === "cloning") {
      return { title: stageGuideCopy.label, body: stageGuideCopy.waitClone };
    }
    if (!selectedRepository.root_path || selectedRepository.status === "pending") {
      return {
        title: stageGuideCopy.label,
        body: stageGuideCopy.indexRepo,
        actionLabel: stageGuideCopy.startIndex,
        action: () => void repositoriesWorkspace.handleIndexRepository(selectedRepository.id),
        disabled: Boolean(repositoriesWorkspace.indexingRepoId || repositoriesWorkspace.importingRepoId),
      };
    }
    if (selectedRepository.status === "indexing") {
      return { title: stageGuideCopy.label, body: stageGuideCopy.indexing };
    }
    if (
      (patchChecksWorkspace.patchResponse && patchChecksWorkspace.patchResponse.repo_id === selectedRepository.id) ||
      (patchChecksWorkspace.patchBatchResponse &&
        patchChecksWorkspace.patchBatchResponse.repo_id === selectedRepository.id)
    ) {
      return {
        title: stageGuideCopy.label,
        body: stageGuideCopy.reviewPatch,
        actionLabel: stageGuideCopy.openPatch,
        action: () => setActiveView("patch"),
      };
    }
    if (
      (patchChecksWorkspace.patchApplyResponse &&
        patchChecksWorkspace.patchApplyResponse.repo_id === selectedRepository.id) ||
      (patchChecksWorkspace.patchBatchApplyResponse &&
        patchChecksWorkspace.patchBatchApplyResponse.repo_id === selectedRepository.id)
    ) {
      return {
        title: stageGuideCopy.label,
        body: stageGuideCopy.runChecks,
        actionLabel: stageGuideCopy.openChecks,
        action: () => setActiveView("checks"),
      };
    }
    if (
      patchChecksWorkspace.checkResponse &&
      patchChecksWorkspace.checkResponse.repo_id === selectedRepository.id
    ) {
      return {
        title: stageGuideCopy.label,
        body: stageGuideCopy.continueChat,
        actionLabel: stageGuideCopy.openChat,
        action: () => setActiveView("chat"),
      };
    }
    return {
      title: stageGuideCopy.label,
      body: stageGuideCopy.askQuestion,
      actionLabel: stageGuideCopy.openChat,
      action: () => setActiveView("chat"),
    };
  })();

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
        <button
          aria-expanded={isSidebarOpen}
          className="workspace-sidebar-toggle"
          onClick={() => setIsSidebarOpen(true)}
          type="button"
        >
          {drawerCopy.open}
        </button>
        {isSidebarOpen ? (
          <button
            aria-label={drawerCopy.close}
            className="workspace-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          />
        ) : null}
        <aside className={`workspace-sidebar ${isSidebarOpen ? "is-open" : ""}`.trim()}>
          <div className="workspace-sidebar-mobile-bar">
            <div className="focus-card-label">{drawerCopy.open}</div>
            <button className="button-secondary compact-button" onClick={() => setIsSidebarOpen(false)} type="button">
              {drawerCopy.close}
            </button>
          </div>
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
            onSelect={(repoId) => {
              repositoriesWorkspace.setSelectedRepoId(repoId);
              setIsSidebarOpen(false);
            }}
            repositories={repositoriesWorkspace.repositories}
            selectedRepoId={repositoriesWorkspace.selectedRepoId}
          />
          <JobActivityPanel
            jobs={repositoriesWorkspace.recentJobs}
            locale={locale}
            onRetry={repositoriesWorkspace.handleRetryJob}
            onSelectRepository={(repoId) => {
              repositoriesWorkspace.setSelectedRepoId(repoId);
              setIsSidebarOpen(false);
            }}
            repositories={repositoriesWorkspace.repositories}
            retryingJobId={repositoriesWorkspace.retryingJobId}
            selectedRepoId={repositoriesWorkspace.selectedRepoId}
          />
          {hasChatHistory ? (
            <ChatHistoryPanel
              activeSessionId={chatWorkspace.chatResponse?.session_id ?? null}
              entries={chatWorkspace.chatHistory}
              locale={locale}
              onSelectSession={(entry) => {
                chatWorkspace.handleSelectHistory(entry);
                setIsSidebarOpen(false);
              }}
            />
          ) : null}
        </aside>

        <section className="workspace-main">
          <section className="panel-card workflow-guide-card">
            <div className="answer-header">
              <div>
                <div className="focus-card-label">{stageGuide.title}</div>
                <div className="focus-card-title">
                  {selectedRepository?.name ?? copy.workspace.noRepositorySelected}
                </div>
              </div>
              {stageGuide.actionLabel ? (
                <button
                  className="button-primary"
                  disabled={stageGuide.disabled}
                  onClick={stageGuide.action}
                  type="button"
                >
                  {stageGuide.actionLabel}
                </button>
              ) : null}
            </div>
            <div className="focus-card-copy">{stageGuide.body}</div>
          </section>

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
                  onOpenChecks={() => setActiveView("checks")}
                  onOpenPatch={() => setActiveView("patch")}
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
              onOpenChat={() => setActiveView("chat")}
              onOpenChecks={() => setActiveView("checks")}
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
              onOpenChat={() => setActiveView("chat")}
              onOpenPatch={() => setActiveView("patch")}
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

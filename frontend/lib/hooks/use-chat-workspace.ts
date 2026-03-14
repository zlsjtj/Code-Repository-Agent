"use client";

import { useState } from "react";

import { askRepositoryQuestion } from "@/lib/api";
import type {
  ChatAskResponse,
  RepositoryRecord,
  WorkspaceChatEntry,
} from "@/lib/types";

import type { WorkspaceFeedbackHandlers } from "./workspace-shared";
import { toErrorMessage } from "./workspace-shared";

type UseChatWorkspaceOptions = WorkspaceFeedbackHandlers & {
  repositories: RepositoryRecord[];
  selectedRepoId: number | null;
  setSelectedRepoId: (repoId: number | null) => void;
};

export function useChatWorkspace({
  repositories,
  selectedRepoId,
  setSelectedRepoId,
  setError,
  setStatusMessage,
}: UseChatWorkspaceOptions) {
  const [chatResponse, setChatResponse] = useState<ChatAskResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<WorkspaceChatEntry[]>([]);
  const [activeChatRepoId, setActiveChatRepoId] = useState<number | null>(null);
  const [isAsking, setIsAsking] = useState(false);

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
      setChatHistory((current) =>
        [
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
        ].slice(0, 8),
      );
      setStatusMessage("问答已完成，下面可以查看引用和工具调用摘要。");
    } catch (askError) {
      setError(toErrorMessage(askError, "Unable to ask the repository question."));
    } finally {
      setIsAsking(false);
    }
  }

  function handleSelectHistory(entry: WorkspaceChatEntry) {
    setSelectedRepoId(entry.repository_id);
    setActiveChatRepoId(entry.repository_id);
    setChatResponse(entry.response);
    setStatusMessage(`已切换到历史会话：${entry.repository_name}`);
  }

  const citedSessionCount = chatHistory.filter((entry) => entry.response.citations.length > 0).length;
  const suggestedPatchPath =
    activeChatRepoId === selectedRepoId ? chatResponse?.citations[0]?.path ?? null : null;

  return {
    chatResponse,
    chatHistory,
    isAsking,
    citedSessionCount,
    suggestedPatchPath,
    handleAsk,
    handleSelectHistory,
  };
}

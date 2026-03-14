"use client";

import { startTransition, useEffect, useState } from "react";

import {
  applyPatchBatchAndRunChecks,
  applyPatchDraftBatch,
  applyPatchAndRunChecks,
  applyPatchDraft,
  createPatchDraftBatch,
  createPatchDraft,
  fetchCheckProfiles,
  fetchRecommendedChecks,
  runRepositoryChecks,
} from "@/lib/api";
import type {
  CheckProfile,
  CheckRecommendationResponse,
  CheckRunResponse,
  PatchApplyAndCheckResponse,
  PatchApplyResponse,
  PatchBatchApplyAndCheckResponse,
  PatchBatchApplyResponse,
  PatchBatchDraftResponse,
  PatchDraftFile,
  PatchDraftResponse,
  RepositoryRecord,
} from "@/lib/types";

import type { WorkspaceFeedbackHandlers } from "./workspace-shared";
import { toErrorMessage } from "./workspace-shared";

type UsePatchChecksWorkspaceOptions = WorkspaceFeedbackHandlers & {
  selectedRepoId: number | null;
  selectedRepository: RepositoryRecord | null;
  setSelectedRepoId: (repoId: number | null) => void;
};

export function usePatchChecksWorkspace({
  selectedRepoId,
  selectedRepository,
  setSelectedRepoId,
  setError,
  setStatusMessage,
}: UsePatchChecksWorkspaceOptions) {
  const [patchResponse, setPatchResponse] = useState<PatchDraftResponse | null>(null);
  const [patchBatchResponse, setPatchBatchResponse] = useState<PatchBatchDraftResponse | null>(null);
  const [patchApplyResponse, setPatchApplyResponse] = useState<PatchApplyResponse | null>(null);
  const [patchBatchApplyResponse, setPatchBatchApplyResponse] =
    useState<PatchBatchApplyResponse | null>(null);
  const [checkProfiles, setCheckProfiles] = useState<CheckProfile[]>([]);
  const [checkRecommendation, setCheckRecommendation] =
    useState<CheckRecommendationResponse | null>(null);
  const [checkResponse, setCheckResponse] = useState<CheckRunResponse | null>(null);
  const [isLoadingCheckProfiles, setIsLoadingCheckProfiles] = useState(false);
  const [isLoadingCheckRecommendation, setIsLoadingCheckRecommendation] = useState(false);
  const [isDraftingPatch, setIsDraftingPatch] = useState(false);
  const [isApplyingPatch, setIsApplyingPatch] = useState(false);
  const [isApplyingBatchPatch, setIsApplyingBatchPatch] = useState(false);
  const [isApplyingAndChecking, setIsApplyingAndChecking] = useState(false);
  const [isApplyingBatchAndChecking, setIsApplyingBatchAndChecking] = useState(false);
  const [isRunningChecks, setIsRunningChecks] = useState(false);

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
      if (!selectedRepository || !selectedRepository.root_path) {
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
        setError(toErrorMessage(loadError, "Unable to load available checks."));
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
  }, [selectedRepository, setError]);

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
        !selectedRepository.root_path ||
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
        setError(toErrorMessage(loadError, "Unable to load recommended checks."));
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
  }, [patchBatchResponse, patchResponse, selectedRepository, setError]);

  function getRecommendedProfileIds(): string[] | undefined {
    return checkRecommendation && checkRecommendation.items.length > 0
      ? checkRecommendation.items.map((item) => item.id)
      : undefined;
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
      setError(toErrorMessage(draftError, "Unable to draft the patch."));
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
        profile_ids: getRecommendedProfileIds(),
        proposed_content: draft.proposed_content,
        repo_id: draft.repo_id,
        target_path: draft.target_path,
      });
      setPatchApplyResponse(response.patch);
      setCheckResponse(response.checks);
      setStatusMessage(`patch 已处理并完成检查：${response.checks.summary}`);
    } catch (applyError) {
      setError(toErrorMessage(applyError, "Unable to apply and verify the patch."));
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
      setError(toErrorMessage(applyError, "Unable to apply the patch."));
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
      setError(toErrorMessage(applyError, "Unable to apply the batch patch."));
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
        profile_ids: getRecommendedProfileIds(),
        repo_id: repoId,
      });
      setPatchApplyResponse(null);
      setPatchBatchApplyResponse(response.patch);
      setCheckResponse(response.checks);
      setStatusMessage(`批量 patch 已处理并完成检查：${response.checks.summary}`);
    } catch (applyError) {
      setError(toErrorMessage(applyError, "Unable to apply and verify the batch patch."));
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
      setError(toErrorMessage(checkError, "Unable to run repository checks."));
    } finally {
      setIsRunningChecks(false);
    }
  }

  return {
    patchResponse,
    patchBatchResponse,
    patchApplyResponse,
    patchBatchApplyResponse,
    checkProfiles,
    checkRecommendation,
    checkResponse,
    isLoadingCheckProfiles,
    isLoadingCheckRecommendation,
    isDraftingPatch,
    isApplyingPatch,
    isApplyingBatchPatch,
    isApplyingAndChecking,
    isApplyingBatchAndChecking,
    isRunningChecks,
    recommendedCheckCount: checkRecommendation?.items.length ?? 0,
    handleDraftPatch,
    handleApplyPatchAndRunChecks,
    handleApplyPatch,
    handleApplyPatchBatch,
    handleApplyPatchBatchAndRunChecks,
    handleRunChecks,
  };
}

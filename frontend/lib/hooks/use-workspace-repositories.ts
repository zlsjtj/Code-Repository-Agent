"use client";

import { startTransition, useEffect, useState } from "react";

import {
  createRepository,
  fetchHealth,
  fetchMeta,
  indexRepository,
  listRepositories,
} from "@/lib/api";
import type {
  HealthResponse,
  MetaResponse,
  RepositoryCreatePayload,
  RepositoryRecord,
} from "@/lib/types";

import type { WorkspaceFeedbackHandlers } from "./workspace-shared";
import { toErrorMessage } from "./workspace-shared";

export function useWorkspaceRepositories({
  setError,
  setStatusMessage,
}: WorkspaceFeedbackHandlers) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [repositories, setRepositories] = useState<RepositoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

        setError(toErrorMessage(loadError, "Unable to load the backend workspace."));
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
  }, [setError]);

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
        (repository) => Boolean(repository.root_path) && repository.status === "ready",
      );
      return preferredRepository?.id ?? repositories[0].id;
    });
  }, [repositories]);

  async function refreshRepositories() {
    const repositoriesResponse = await listRepositories();
    startTransition(() => {
      setRepositories(repositoriesResponse.items);
    });
  }

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
      setError(toErrorMessage(submitError, "Unable to register the repository."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleIndexRepository(repoId: number) {
    setIndexingRepoId(repoId);
    setError(null);
    setStatusMessage(null);

    try {
      const summary = await indexRepository(repoId);
      await refreshRepositories();
      setStatusMessage(summary.message);
    } catch (indexError) {
      setError(toErrorMessage(indexError, "Unable to index the repository."));
    } finally {
      setIndexingRepoId(null);
    }
  }

  const selectedRepository =
    repositories.find((repository) => repository.id === selectedRepoId) ?? null;
  const readyRepositories = repositories.filter(
    (repository) => Boolean(repository.root_path) && repository.status === "ready",
  );

  return {
    health,
    meta,
    repositories,
    readyRepositories,
    selectedRepoId,
    selectedRepository,
    isLoading,
    isSubmitting,
    indexingRepoId,
    setSelectedRepoId,
    handleRepositorySubmit,
    handleIndexRepository,
    refreshRepositories,
  };
}

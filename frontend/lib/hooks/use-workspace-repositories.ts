"use client";

import { startTransition, useEffect, useState } from "react";

import {
  createRepositoryImportJob,
  createRepositoryIndexJob,
  createRepository,
  fetchJob,
  fetchHealth,
  fetchMeta,
  listRepositories,
} from "@/lib/api";
import type {
  HealthResponse,
  JobRun,
  MetaResponse,
  RepositoryCreatePayload,
  RepositoryRecord,
} from "@/lib/types";
import type { WorkspaceLocale } from "@/lib/workspace-i18n";
import { getWorkspaceCopy } from "@/lib/workspace-i18n";

import type { WorkspaceFeedbackHandlers } from "./workspace-shared";
import { toErrorMessage } from "./workspace-shared";

type UseWorkspaceRepositoriesOptions = WorkspaceFeedbackHandlers & {
  locale: WorkspaceLocale;
};

export function useWorkspaceRepositories({
  locale,
  setError,
  setStatusMessage,
}: UseWorkspaceRepositoriesOptions) {
  const copy = getWorkspaceCopy(locale);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [repositories, setRepositories] = useState<RepositoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importingRepoId, setImportingRepoId] = useState<number | null>(null);
  const [indexingRepoId, setIndexingRepoId] = useState<number | null>(null);
  const [activeImportJob, setActiveImportJob] = useState<JobRun | null>(null);
  const [activeIndexJob, setActiveIndexJob] = useState<JobRun | null>(null);
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
        setError(toErrorMessage(loadError, copy.feedback.loadWorkspace));
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
  }, [copy.feedback.loadWorkspace, setError]);

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
      return preferredRepository?.id ?? repositories[0]?.id ?? null;
    });
  }, [repositories]);

  async function refreshRepositories() {
    const repositoriesResponse = await listRepositories();
    startTransition(() => {
      setRepositories(repositoriesResponse.items);
    });
    return repositoriesResponse.items;
  }

  async function handleRepositorySubmit(payload: RepositoryCreatePayload) {
    setIsSubmitting(true);
    setError(null);
    setStatusMessage(null);

    try {
      if (payload.source_type === "github") {
        const importResponse = await createRepositoryImportJob(payload, locale);
        startTransition(() => {
          setRepositories((current) => [importResponse.repository, ...current]);
        });
        setSelectedRepoId(importResponse.repository.id);
        setImportingRepoId(importResponse.repository.id);
        setActiveImportJob(importResponse.job);
        setStatusMessage(importResponse.job.message ?? copy.feedback.registerRepository);
      } else {
        const created = await createRepository(payload, locale);
        startTransition(() => {
          setRepositories((current) => [created, ...current]);
        });
        setSelectedRepoId(created.id);
        setStatusMessage(copy.feedback.repositoryRegistered(created.name));
      }
    } catch (submitError) {
      setError(toErrorMessage(submitError, copy.feedback.registerRepository));
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!activeImportJob || !importingRepoId) {
      return;
    }
    if (activeImportJob.status === "succeeded" || activeImportJob.status === "failed") {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const nextJob = await fetchJob(activeImportJob.id, locale);
        if (cancelled) {
          return;
        }
        setActiveImportJob(nextJob);

        if (nextJob.status === "succeeded") {
          await refreshRepositories();
          setStatusMessage(nextJob.message ?? copy.feedback.repositoryRegistered("GitHub"));
          setImportingRepoId(null);
          setActiveImportJob(null);
        } else if (nextJob.status === "failed") {
          await refreshRepositories();
          setError(nextJob.message ?? copy.feedback.registerRepository);
          setImportingRepoId(null);
          setActiveImportJob(null);
        }
      } catch (jobError) {
        if (cancelled) {
          return;
        }
        setError(toErrorMessage(jobError, copy.feedback.registerRepository));
        setImportingRepoId(null);
        setActiveImportJob(null);
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    activeImportJob,
    copy.feedback.registerRepository,
    importingRepoId,
    locale,
    refreshRepositories,
    setError,
    setStatusMessage,
  ]);

  useEffect(() => {
    if (!activeIndexJob || !indexingRepoId) {
      return;
    }
    if (activeIndexJob.status === "succeeded" || activeIndexJob.status === "failed") {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const nextJob = await fetchJob(activeIndexJob.id, locale);
        if (cancelled) {
          return;
        }
        setActiveIndexJob(nextJob);

        if (nextJob.status === "succeeded") {
          await refreshRepositories();
          setStatusMessage(copy.feedback.indexCompleted(nextJob.file_count, nextJob.chunk_count));
          setIndexingRepoId(null);
          setActiveIndexJob(null);
        } else if (nextJob.status === "failed") {
          setError(nextJob.message ?? copy.feedback.indexRepository);
          setIndexingRepoId(null);
          setActiveIndexJob(null);
        }
      } catch (jobError) {
        if (cancelled) {
          return;
        }
        setError(toErrorMessage(jobError, copy.feedback.indexRepository));
        setIndexingRepoId(null);
        setActiveIndexJob(null);
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    activeIndexJob,
    copy.feedback.indexCompleted,
    copy.feedback.indexRepository,
    indexingRepoId,
    locale,
    refreshRepositories,
    setError,
    setStatusMessage,
  ]);

  async function handleIndexRepository(repoId: number) {
    setIndexingRepoId(repoId);
    setActiveIndexJob(null);
    setError(null);
    setStatusMessage(null);

    try {
      const job = await createRepositoryIndexJob(repoId, locale);
      setActiveIndexJob(job);
      setStatusMessage(job.message ?? copy.repositoryList.indexing);
    } catch (indexError) {
      setError(toErrorMessage(indexError, copy.feedback.indexRepository));
      setIndexingRepoId(null);
    } finally {
      // Polling lifecycle owns cleanup after the job starts.
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
    importingRepoId,
    indexingRepoId,
    setSelectedRepoId,
    handleRepositorySubmit,
    handleIndexRepository,
    refreshRepositories,
  };
}

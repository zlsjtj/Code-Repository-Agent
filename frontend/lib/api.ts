import type {
  PatchBatchApplyAndCheckPayload,
  PatchBatchApplyAndCheckResponse,
  PatchBatchApplyPayload,
  PatchBatchApplyResponse,
  PatchBatchDraftPayload,
  PatchBatchDraftResponse,
  CheckProfileListResponse,
  CheckRecommendationPayload,
  CheckRecommendationResponse,
  CheckRunPayload,
  CheckRunResponse,
  PatchApplyAndCheckPayload,
  PatchApplyAndCheckResponse,
  PatchApplyPayload,
  PatchApplyResponse,
  ChatAskPayload,
  ChatAskResponse,
  HealthResponse,
  JobRun,
  JobRunListResponse,
  MetaResponse,
  PatchDraftPayload,
  PatchDraftResponse,
  RepositoryCreatePayload,
  RepositoryImportJobResponse,
  RepositoryIndexResponse,
  RepositoryListResponse,
  RepositoryRecord,
} from "@/lib/types";
import type { WorkspaceLocale } from "@/lib/workspace-i18n";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type RequestOptions = RequestInit & {
  locale?: WorkspaceLocale;
};

function buildLocaleHeaders(locale?: WorkspaceLocale): HeadersInit | undefined {
  if (!locale) {
    return undefined;
  }
  return {
    "X-Response-Language": locale,
  };
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(buildLocaleHeaders(init?.locale) ?? {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}.`;
    try {
      const payload = (await response.json()) as { detail?: string };
      detail = payload.detail ?? detail;
    } catch {
      // Ignore JSON parsing issues and keep the default error message.
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export function fetchHealth() {
  return request<HealthResponse>("/api/health");
}

export function fetchMeta() {
  return request<MetaResponse>("/api/meta");
}

export function listRepositories() {
  return request<RepositoryListResponse>("/api/repositories");
}

export function createRepository(payload: RepositoryCreatePayload, locale?: WorkspaceLocale) {
  return request<RepositoryRecord>("/api/repositories", {
    body: JSON.stringify(payload),
    locale,
    method: "POST",
  });
}

export function createRepositoryImportJob(
  payload: RepositoryCreatePayload,
  locale?: WorkspaceLocale,
) {
  return request<RepositoryImportJobResponse>("/api/repositories/import-jobs", {
    body: JSON.stringify(payload),
    locale,
    method: "POST",
  });
}

export function indexRepository(repoId: number, locale?: WorkspaceLocale) {
  return request<RepositoryIndexResponse>(`/api/repositories/${repoId}/index`, {
    locale,
    method: "POST",
  });
}

export function createRepositoryIndexJob(repoId: number, locale?: WorkspaceLocale) {
  return request<JobRun>(`/api/repositories/${repoId}/index-jobs`, {
    locale,
    method: "POST",
  });
}

export function fetchJob(jobId: number, locale?: WorkspaceLocale) {
  return request<JobRun>(`/api/jobs/${jobId}`, {
    locale,
  });
}

export function listJobs(repoId?: number, locale?: WorkspaceLocale) {
  const params = new URLSearchParams({ limit: "12" });
  if (repoId) {
    params.set("repo_id", String(repoId));
  }
  return request<JobRunListResponse>(`/api/jobs?${params.toString()}`, {
    locale,
  });
}

export function retryJob(jobId: number, locale?: WorkspaceLocale) {
  return request<JobRun>(`/api/jobs/${jobId}/retry`, {
    locale,
    method: "POST",
  });
}

export function askRepositoryQuestion(payload: ChatAskPayload) {
  return request<ChatAskResponse>("/api/chat/ask", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function createPatchDraft(payload: PatchDraftPayload) {
  return request<PatchDraftResponse>("/api/patches/draft", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function createPatchDraftBatch(payload: PatchBatchDraftPayload) {
  return request<PatchBatchDraftResponse>("/api/patches/draft-batch", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function applyPatchDraft(payload: PatchApplyPayload, locale?: WorkspaceLocale) {
  return request<PatchApplyResponse>("/api/patches/apply", {
    body: JSON.stringify(payload),
    locale,
    method: "POST",
  });
}

export function applyPatchDraftBatch(payload: PatchBatchApplyPayload, locale?: WorkspaceLocale) {
  return request<PatchBatchApplyResponse>("/api/patches/apply-batch", {
    body: JSON.stringify(payload),
    locale,
    method: "POST",
  });
}

export function applyPatchAndRunChecks(payload: PatchApplyAndCheckPayload) {
  return request<PatchApplyAndCheckResponse>("/api/patches/apply-and-checks", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function applyPatchBatchAndRunChecks(payload: PatchBatchApplyAndCheckPayload) {
  return request<PatchBatchApplyAndCheckResponse>("/api/patches/apply-batch-and-checks", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function fetchCheckProfiles(repoId: number) {
  return request<CheckProfileListResponse>(`/api/checks/repositories/${repoId}/profiles`);
}

export function fetchRecommendedChecks(payload: CheckRecommendationPayload) {
  return request<CheckRecommendationResponse>("/api/checks/recommend", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function runRepositoryChecks(payload: CheckRunPayload) {
  return request<CheckRunResponse>("/api/checks/run", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

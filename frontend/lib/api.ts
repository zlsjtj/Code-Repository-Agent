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
  MetaResponse,
  PatchDraftPayload,
  PatchDraftResponse,
  RepositoryCreatePayload,
  RepositoryIndexResponse,
  RepositoryListResponse,
  RepositoryRecord,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
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

export function createRepository(payload: RepositoryCreatePayload) {
  return request<RepositoryRecord>("/api/repositories", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function indexRepository(repoId: number) {
  return request<RepositoryIndexResponse>(`/api/repositories/${repoId}/index`, {
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

export function applyPatchDraft(payload: PatchApplyPayload) {
  return request<PatchApplyResponse>("/api/patches/apply", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function applyPatchDraftBatch(payload: PatchBatchApplyPayload) {
  return request<PatchBatchApplyResponse>("/api/patches/apply-batch", {
    body: JSON.stringify(payload),
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

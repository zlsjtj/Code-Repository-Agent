import type { components, operations, paths } from "./generated/api-types";

type ApiSchema<Name extends keyof components["schemas"]> = components["schemas"][Name];

export type ApiPaths = paths;
export type ApiOperations = operations;

export type RepositorySourceType = ApiSchema<"RepositoryCreate">["source_type"];
export type RepositoryStatus = ApiSchema<"RepositoryRead">["status"];
export type CheckCategory = ApiSchema<"CheckProfileRead">["category"];
export type CheckStatus = ApiSchema<"CheckRunResponse">["status"];

export type HealthResponse = ApiSchema<"HealthResponse">;
export type MetaResponse = ApiSchema<"MetaResponse">;

export type RepositoryRecord = ApiSchema<"RepositoryRead">;
export type RepositoryListResponse = ApiSchema<"RepositoryListResponse">;
export type RepositoryImportJobResponse = ApiSchema<"RepositoryImportJobResponse">;
export type RepositoryIndexResponse = ApiSchema<"RepositoryIndexResponse">;
export type RepositoryIndexStatusResponse = ApiSchema<"RepositoryIndexStatusResponse">;
export type RepositoryTreeNode = ApiSchema<"RepositoryTreeNode">;
export type RepositoryTreeResponse = ApiSchema<"RepositoryTreeResponse">;
export type RepositoryCreatePayload = ApiSchema<"RepositoryCreate">;
export type JobRun = ApiSchema<"JobRunRead">;

export type ChatCitation = ApiSchema<"ChatCitation">;
export type ChatTraceStep = ApiSchema<"ChatTraceStep">;
export type ChatTraceSummary = ApiSchema<"ChatTraceSummary">;
export type ChatAskPayload = ApiSchema<"ChatAskRequest">;
export type ChatAskResponse = ApiSchema<"ChatAskResponse">;

export type WorkspaceChatEntry = {
  session_id: string;
  question: string;
  asked_at: string;
  repository_id: number;
  repository_name: string;
  repository_language: string | null;
  response: ChatAskResponse;
};

export type PatchDraftPayload = ApiSchema<"PatchDraftRequest">;
export type PatchBatchDraftPayload = ApiSchema<"PatchBatchDraftRequest">;
export type PatchDraftTraceSummary = ApiSchema<"PatchDraftTraceSummary">;
export type PatchDraftFile = Omit<ApiSchema<"PatchDraftFile">, "warnings"> & {
  warnings: string[];
};
export type PatchDraftResponse = Omit<ApiSchema<"PatchDraftResponse">, "warnings"> & {
  warnings: string[];
};
export type PatchBatchDraftResponse = Omit<ApiSchema<"PatchBatchDraftResponse">, "warnings" | "items"> & {
  warnings: string[];
  items: PatchDraftFile[];
};

export type PatchApplyItemPayload = ApiSchema<"PatchApplyFile">;
export type PatchApplyPayload = ApiSchema<"PatchApplyRequest">;
export type PatchBatchApplyPayload = ApiSchema<"PatchBatchApplyRequest">;
export type PatchApplyResponse = ApiSchema<"PatchApplyResponse">;
export type PatchBatchApplyResponse = ApiSchema<"PatchBatchApplyResponse">;

export type PatchApplyAndCheckPayload = ApiSchema<"PatchApplyAndCheckRequest">;
export type PatchBatchApplyAndCheckPayload = ApiSchema<"PatchBatchApplyAndCheckRequest">;
export type PatchApplyAndCheckResponse = ApiSchema<"PatchApplyAndCheckResponse">;
export type PatchBatchApplyAndCheckResponse = ApiSchema<"PatchBatchApplyAndCheckResponse">;

export type CheckProfile = ApiSchema<"CheckProfileRead">;
export type CheckProfileListResponse = ApiSchema<"CheckProfileListResponse">;
export type CheckRecommendationItem = ApiSchema<"CheckRecommendationItem">;
export type CheckRecommendationPayload = ApiSchema<"CheckRecommendationRequest">;
export type CheckRecommendationResponse = ApiSchema<"CheckRecommendationResponse">;
export type CheckRunPayload = ApiSchema<"CheckRunRequest">;
export type CheckExecutionResult = ApiSchema<"CheckExecutionResult">;
export type CheckRunResponse = ApiSchema<"CheckRunResponse">;

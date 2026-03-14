export type RepositorySourceType = "local" | "github";
export type RepositoryStatus = "pending" | "ready" | "indexing" | "failed";

export type HealthResponse = {
  status: string;
  app_name: string;
  version: string;
};

export type MetaResponse = {
  app_name: string;
  version: string;
  api_prefix: string;
  features: string[];
};

export type RepositoryRecord = {
  id: number;
  name: string;
  source_type: RepositorySourceType;
  source_url: string | null;
  root_path: string | null;
  default_branch: string | null;
  primary_language: string | null;
  status: RepositoryStatus;
  created_at: string;
  updated_at: string;
};

export type RepositoryListResponse = {
  items: RepositoryRecord[];
};

export type RepositoryIndexResponse = {
  repo_id: number;
  status: RepositoryStatus;
  message: string;
  file_count: number;
  chunk_count: number;
  skipped_file_count: number;
};

export type RepositoryCreatePayload = {
  name?: string;
  source_type: RepositorySourceType;
  root_path?: string;
  source_url?: string;
  default_branch?: string;
};

export type ChatCitation = {
  path: string;
  start_line: number | null;
  end_line: number | null;
  symbol: string | null;
  note: string;
  excerpt: string | null;
};

export type ChatTraceStep = {
  tool_name: string;
  args_summary: string;
  item_count: number;
  summary: string | null;
};

export type ChatTraceSummary = {
  agent_name: string;
  model: string;
  latency_ms: number;
  tool_call_count: number;
  steps: ChatTraceStep[];
};

export type ChatAskPayload = {
  repo_id: number;
  question: string;
  session_id?: string;
};

export type ChatAskResponse = {
  session_id: string;
  answer: string;
  citations: ChatCitation[];
  trace_summary: ChatTraceSummary;
};

export type WorkspaceChatEntry = {
  session_id: string;
  question: string;
  asked_at: string;
  repository_id: number;
  repository_name: string;
  repository_language: string | null;
  response: ChatAskResponse;
};

export type PatchDraftPayload = {
  repo_id: number;
  target_path: string;
  instruction: string;
  session_id?: string;
};

export type PatchBatchDraftPayload = {
  repo_id: number;
  target_paths: string[];
  instruction: string;
  session_id?: string;
};

export type PatchDraftTraceSummary = {
  agent_name: string;
  model: string;
  latency_ms: number;
};

export type PatchDraftFile = {
  target_path: string;
  base_content_sha256: string;
  summary: string;
  rationale: string;
  warnings: string[];
  original_line_count: number;
  proposed_line_count: number;
  line_count_delta: number;
  unified_diff: string;
  proposed_content: string;
  trace_summary: PatchDraftTraceSummary;
};

export type PatchDraftResponse = PatchDraftFile & {
  session_id: string;
  repo_id: number;
};

export type PatchBatchDraftResponse = {
  session_id: string;
  repo_id: number;
  target_paths: string[];
  summary: string;
  warnings: string[];
  changed_file_count: number;
  total_original_line_count: number;
  total_proposed_line_count: number;
  total_line_count_delta: number;
  combined_unified_diff: string;
  items: PatchDraftFile[];
  trace_summary: PatchDraftTraceSummary;
};

export type PatchApplyPayload = {
  repo_id: number;
  target_path: string;
  expected_base_sha256: string;
  proposed_content: string;
};

export type PatchApplyItemPayload = {
  target_path: string;
  expected_base_sha256: string;
  proposed_content: string;
};

export type PatchApplyResponse = {
  repo_id: number;
  target_path: string;
  status: "applied" | "noop";
  message: string;
  previous_sha256: string;
  written_sha256: string;
  written_line_count: number;
  unified_diff: string;
};

export type PatchBatchApplyPayload = {
  repo_id: number;
  items: PatchApplyItemPayload[];
};

export type PatchBatchApplyResponse = {
  repo_id: number;
  status: "applied" | "noop";
  message: string;
  applied_count: number;
  noop_count: number;
  target_paths: string[];
  combined_unified_diff: string;
  results: PatchApplyResponse[];
};

export type PatchApplyAndCheckPayload = {
  repo_id: number;
  target_path: string;
  expected_base_sha256: string;
  proposed_content: string;
  profile_ids?: string[];
};

export type PatchBatchApplyAndCheckPayload = {
  repo_id: number;
  items: PatchApplyItemPayload[];
  profile_ids?: string[];
};

export type CheckCategory = "lint" | "typecheck" | "test";
export type CheckStatus = "passed" | "failed" | "error" | "skipped";

export type CheckProfile = {
  id: string;
  name: string;
  category: CheckCategory;
  working_dir: string;
  command_preview: string;
};

export type CheckProfileListResponse = {
  repo_id: number;
  items: CheckProfile[];
};

export type CheckRecommendationItem = CheckProfile & {
  reason: string;
  score: number;
};

export type CheckRecommendationPayload = {
  repo_id: number;
  changed_paths: string[];
};

export type CheckRecommendationResponse = {
  repo_id: number;
  changed_paths: string[];
  strategy: "matched" | "fallback_all" | "none";
  summary: string;
  items: CheckRecommendationItem[];
};

export type CheckRunPayload = {
  repo_id: number;
  profile_ids?: string[];
};

export type CheckExecutionResult = {
  id: string;
  name: string;
  category: CheckCategory;
  working_dir: string;
  command_preview: string;
  status: CheckStatus;
  exit_code: number | null;
  duration_ms: number;
  stdout: string;
  stderr: string;
  truncated: boolean;
};

export type CheckRunResponse = {
  repo_id: number;
  status: CheckStatus;
  summary: string;
  results: CheckExecutionResult[];
};

export type PatchApplyAndCheckResponse = {
  patch: PatchApplyResponse;
  checks: CheckRunResponse;
};

export type PatchBatchApplyAndCheckResponse = {
  patch: PatchBatchApplyResponse;
  checks: CheckRunResponse;
};

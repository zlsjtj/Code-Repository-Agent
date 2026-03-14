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

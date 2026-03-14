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

export type RepositoryCreatePayload = {
  name?: string;
  source_type: RepositorySourceType;
  root_path?: string;
  source_url?: string;
  default_branch?: string;
};


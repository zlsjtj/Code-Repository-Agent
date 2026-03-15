export interface paths {
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health Check */
        get: operations["health_check_api_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/meta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Meta */
        get: operations["get_meta_api_meta_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/repositories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Repositories */
        get: operations["list_repositories_api_repositories_get"];
        put?: never;
        /** Create Repository */
        post: operations["create_repository_api_repositories_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/repositories/import-jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Repository Import Job */
        post: operations["create_repository_import_job_api_repositories_import_jobs_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/repositories/{repo_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Repository */
        get: operations["get_repository_api_repositories__repo_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/repositories/{repo_id}/tree": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Repository Tree */
        get: operations["get_repository_tree_api_repositories__repo_id__tree_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/repositories/{repo_id}/index-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Index Status */
        get: operations["get_index_status_api_repositories__repo_id__index_status_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/repositories/{repo_id}/chunks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Repository Chunks */
        get: operations["list_repository_chunks_api_repositories__repo_id__chunks_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/repositories/{repo_id}/index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Request Index */
        post: operations["request_index_api_repositories__repo_id__index_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/repositories/{repo_id}/index-jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Index Job */
        post: operations["create_index_job_api_repositories__repo_id__index_jobs_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/jobs/{job_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Job */
        get: operations["get_job_api_jobs__job_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tools/list-tree": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** List Repo Tree */
        post: operations["list_repo_tree_api_tools_list_tree_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tools/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Search Repo */
        post: operations["search_repo_api_tools_search_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tools/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Read File */
        post: operations["read_file_api_tools_read_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tools/find-symbol": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Find Symbol */
        post: operations["find_symbol_api_tools_find_symbol_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/chat/ask": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Ask Repository Question */
        post: operations["ask_repository_question_api_chat_ask_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/patches/draft": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Draft Patch */
        post: operations["draft_patch_api_patches_draft_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/patches/draft-batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Draft Patch Batch */
        post: operations["draft_patch_batch_api_patches_draft_batch_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/patches/apply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply Patch */
        post: operations["apply_patch_api_patches_apply_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/patches/apply-batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply Patch Batch */
        post: operations["apply_patch_batch_api_patches_apply_batch_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/patches/apply-and-checks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply Patch And Run Checks */
        post: operations["apply_patch_and_run_checks_api_patches_apply_and_checks_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/patches/apply-batch-and-checks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply Patch Batch And Run Checks */
        post: operations["apply_patch_batch_and_run_checks_api_patches_apply_batch_and_checks_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/checks/repositories/{repo_id}/profiles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Check Profiles */
        get: operations["list_check_profiles_api_checks_repositories__repo_id__profiles_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/checks/recommend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Recommend Checks */
        post: operations["recommend_checks_api_checks_recommend_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/checks/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Run Checks */
        post: operations["run_checks_api_checks_run_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** ChatAskRequest */
        ChatAskRequest: {
            /** Repo Id */
            repo_id: number;
            /** Question */
            question: string;
            /** Session Id */
            session_id?: string | null;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** ChatAskResponse */
        ChatAskResponse: {
            /** Session Id */
            session_id: string;
            /** Answer */
            answer: string;
            /** Citations */
            citations: components["schemas"]["ChatCitation"][];
            trace_summary: components["schemas"]["ChatTraceSummary"];
        };
        /** ChatCitation */
        ChatCitation: {
            /** Path */
            path: string;
            /** Start Line */
            start_line?: number | null;
            /** End Line */
            end_line?: number | null;
            /** Symbol */
            symbol?: string | null;
            /**
             * Note
             * @description Why this citation supports the answer.
             */
            note: string;
            /**
             * Excerpt
             * @description Short supporting snippet when available.
             */
            excerpt?: string | null;
        };
        /** ChatTraceStep */
        ChatTraceStep: {
            /** Tool Name */
            tool_name: string;
            /** Args Summary */
            args_summary: string;
            /** Item Count */
            item_count: number;
            /** Summary */
            summary?: string | null;
        };
        /** ChatTraceSummary */
        ChatTraceSummary: {
            /** Agent Name */
            agent_name: string;
            /** Model */
            model: string;
            /** Latency Ms */
            latency_ms: number;
            /** Tool Call Count */
            tool_call_count: number;
            /** Steps */
            steps: components["schemas"]["ChatTraceStep"][];
        };
        /** CheckExecutionResult */
        CheckExecutionResult: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /**
             * Category
             * @enum {string}
             */
            category: "lint" | "typecheck" | "test";
            /** Working Dir */
            working_dir: string;
            /** Command Preview */
            command_preview: string;
            /**
             * Status
             * @enum {string}
             */
            status: "passed" | "failed" | "error" | "skipped";
            /** Exit Code */
            exit_code?: number | null;
            /** Duration Ms */
            duration_ms: number;
            /**
             * Stdout
             * @default
             */
            stdout: string;
            /**
             * Stderr
             * @default
             */
            stderr: string;
            /**
             * Truncated
             * @default false
             */
            truncated: boolean;
        };
        /** CheckProfileListResponse */
        CheckProfileListResponse: {
            /** Repo Id */
            repo_id: number;
            /** Items */
            items: components["schemas"]["CheckProfileRead"][];
        };
        /** CheckProfileRead */
        CheckProfileRead: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /**
             * Category
             * @enum {string}
             */
            category: "lint" | "typecheck" | "test";
            /** Working Dir */
            working_dir: string;
            /** Command Preview */
            command_preview: string;
        };
        /** CheckRecommendationItem */
        CheckRecommendationItem: {
            /** Id */
            id: string;
            /** Name */
            name: string;
            /**
             * Category
             * @enum {string}
             */
            category: "lint" | "typecheck" | "test";
            /** Working Dir */
            working_dir: string;
            /** Command Preview */
            command_preview: string;
            /** Reason */
            reason: string;
            /** Score */
            score: number;
        };
        /** CheckRecommendationRequest */
        CheckRecommendationRequest: {
            /** Repo Id */
            repo_id: number;
            /** Changed Paths */
            changed_paths?: string[];
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** CheckRecommendationResponse */
        CheckRecommendationResponse: {
            /** Repo Id */
            repo_id: number;
            /** Changed Paths */
            changed_paths: string[];
            /**
             * Strategy
             * @enum {string}
             */
            strategy: "matched" | "fallback_all" | "none";
            /** Summary */
            summary: string;
            /** Items */
            items: components["schemas"]["CheckRecommendationItem"][];
        };
        /** CheckRunRequest */
        CheckRunRequest: {
            /** Repo Id */
            repo_id: number;
            /** Profile Ids */
            profile_ids?: string[] | null;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** CheckRunResponse */
        CheckRunResponse: {
            /** Repo Id */
            repo_id: number;
            /**
             * Status
             * @enum {string}
             */
            status: "passed" | "failed" | "error" | "skipped";
            /** Summary */
            summary: string;
            /** Results */
            results: components["schemas"]["CheckExecutionResult"][];
        };
        /** FileChunkListResponse */
        FileChunkListResponse: {
            /** Items */
            items: components["schemas"]["FileChunkRead"][];
        };
        /** FileChunkRead */
        FileChunkRead: {
            /** Id */
            id: number;
            /** Repo Id */
            repo_id: number;
            /** Path */
            path: string;
            /** Language */
            language: string | null;
            /** Chunk Index */
            chunk_index: number;
            /** Start Line */
            start_line: number;
            /** End Line */
            end_line: number;
            /** Text */
            text: string;
            /** Hash */
            hash: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
        };
        /** FindSymbolRequest */
        FindSymbolRequest: {
            /** Repo Id */
            repo_id: number;
            /** Name */
            name: string;
            /** Path Hint */
            path_hint?: string | null;
            /**
             * Limit
             * @default 10
             */
            limit: number;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** HealthResponse */
        HealthResponse: {
            /** Status */
            status: string;
            /** App Name */
            app_name: string;
            /** Version */
            version: string;
        };
        /** JobRunRead */
        JobRunRead: {
            /** Id */
            id: number;
            /** Repo Id */
            repo_id: number;
            /**
             * Job Type
             * @enum {string}
             */
            job_type: "repository_index" | "repository_clone";
            /**
             * Status
             * @enum {string}
             */
            status: "queued" | "running" | "succeeded" | "failed";
            /** Message */
            message: string | null;
            /** File Count */
            file_count: number;
            /** Chunk Count */
            chunk_count: number;
            /** Skipped File Count */
            skipped_file_count: number;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Started At */
            started_at: string | null;
            /** Finished At */
            finished_at: string | null;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** ListRepoTreeRequest */
        ListRepoTreeRequest: {
            /** Repo Id */
            repo_id: number;
            /**
             * Path
             * @default
             */
            path: string;
            /**
             * Depth
             * @default 3
             */
            depth: number;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** MetaResponse */
        MetaResponse: {
            /** App Name */
            app_name: string;
            /** Version */
            version: string;
            /** Api Prefix */
            api_prefix: string;
            /** Features */
            features: string[];
        };
        /** PatchApplyAndCheckRequest */
        PatchApplyAndCheckRequest: {
            /** Target Path */
            target_path: string;
            /** Expected Base Sha256 */
            expected_base_sha256: string;
            /** Proposed Content */
            proposed_content: string;
            /** Repo Id */
            repo_id: number;
            /** Profile Ids */
            profile_ids?: string[] | null;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** PatchApplyAndCheckResponse */
        PatchApplyAndCheckResponse: {
            patch: components["schemas"]["PatchApplyResponse"];
            checks: components["schemas"]["CheckRunResponse"];
        };
        /** PatchApplyFile */
        PatchApplyFile: {
            /** Target Path */
            target_path: string;
            /** Expected Base Sha256 */
            expected_base_sha256: string;
            /** Proposed Content */
            proposed_content: string;
        };
        /** PatchApplyRequest */
        PatchApplyRequest: {
            /** Target Path */
            target_path: string;
            /** Expected Base Sha256 */
            expected_base_sha256: string;
            /** Proposed Content */
            proposed_content: string;
            /** Repo Id */
            repo_id: number;
        };
        /** PatchApplyResponse */
        PatchApplyResponse: {
            /** Repo Id */
            repo_id: number;
            /** Target Path */
            target_path: string;
            /**
             * Status
             * @enum {string}
             */
            status: "applied" | "noop" | "rolled_back";
            /** Message */
            message: string;
            /** Previous Sha256 */
            previous_sha256: string;
            /** Written Sha256 */
            written_sha256: string;
            /** Written Line Count */
            written_line_count: number;
            /** Unified Diff */
            unified_diff: string;
        };
        /** PatchBatchApplyAndCheckRequest */
        PatchBatchApplyAndCheckRequest: {
            /** Repo Id */
            repo_id: number;
            /** Items */
            items: components["schemas"]["PatchApplyFile"][];
            /** Profile Ids */
            profile_ids?: string[] | null;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** PatchBatchApplyAndCheckResponse */
        PatchBatchApplyAndCheckResponse: {
            patch: components["schemas"]["PatchBatchApplyResponse"];
            checks: components["schemas"]["CheckRunResponse"];
        };
        /** PatchBatchApplyRequest */
        PatchBatchApplyRequest: {
            /** Repo Id */
            repo_id: number;
            /** Items */
            items: components["schemas"]["PatchApplyFile"][];
        };
        /** PatchBatchApplyResponse */
        PatchBatchApplyResponse: {
            /** Repo Id */
            repo_id: number;
            /**
             * Status
             * @enum {string}
             */
            status: "applied" | "noop" | "rolled_back";
            /** Message */
            message: string;
            /** Applied Count */
            applied_count: number;
            /** Noop Count */
            noop_count: number;
            /**
             * Rolled Back Count
             * @default 0
             */
            rolled_back_count: number;
            /** Target Paths */
            target_paths: string[];
            /** Combined Unified Diff */
            combined_unified_diff: string;
            /** Results */
            results: components["schemas"]["PatchApplyResponse"][];
        };
        /** PatchBatchDraftRequest */
        PatchBatchDraftRequest: {
            /** Repo Id */
            repo_id: number;
            /** Target Paths */
            target_paths: string[];
            /** Instruction */
            instruction: string;
            /** Session Id */
            session_id?: string | null;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** PatchBatchDraftResponse */
        PatchBatchDraftResponse: {
            /** Session Id */
            session_id: string;
            /** Repo Id */
            repo_id: number;
            /** Target Paths */
            target_paths: string[];
            /** Summary */
            summary: string;
            /** Warnings */
            warnings?: string[];
            /** Changed File Count */
            changed_file_count: number;
            /** Total Original Line Count */
            total_original_line_count: number;
            /** Total Proposed Line Count */
            total_proposed_line_count: number;
            /** Total Line Count Delta */
            total_line_count_delta: number;
            /** Combined Unified Diff */
            combined_unified_diff: string;
            /** Items */
            items: components["schemas"]["PatchDraftFile"][];
            trace_summary: components["schemas"]["PatchDraftTraceSummary"];
        };
        /** PatchDraftFile */
        PatchDraftFile: {
            /** Target Path */
            target_path: string;
            /** Base Content Sha256 */
            base_content_sha256: string;
            /** Summary */
            summary: string;
            /** Rationale */
            rationale: string;
            /** Warnings */
            warnings?: string[];
            /** Original Line Count */
            original_line_count: number;
            /** Proposed Line Count */
            proposed_line_count: number;
            /** Line Count Delta */
            line_count_delta: number;
            /** Unified Diff */
            unified_diff: string;
            /** Proposed Content */
            proposed_content: string;
            trace_summary: components["schemas"]["PatchDraftTraceSummary"];
        };
        /** PatchDraftRequest */
        PatchDraftRequest: {
            /** Repo Id */
            repo_id: number;
            /** Target Path */
            target_path: string;
            /** Instruction */
            instruction: string;
            /** Session Id */
            session_id?: string | null;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** PatchDraftResponse */
        PatchDraftResponse: {
            /** Target Path */
            target_path: string;
            /** Base Content Sha256 */
            base_content_sha256: string;
            /** Summary */
            summary: string;
            /** Rationale */
            rationale: string;
            /** Warnings */
            warnings?: string[];
            /** Original Line Count */
            original_line_count: number;
            /** Proposed Line Count */
            proposed_line_count: number;
            /** Line Count Delta */
            line_count_delta: number;
            /** Unified Diff */
            unified_diff: string;
            /** Proposed Content */
            proposed_content: string;
            trace_summary: components["schemas"]["PatchDraftTraceSummary"];
            /** Session Id */
            session_id: string;
            /** Repo Id */
            repo_id: number;
        };
        /** PatchDraftTraceSummary */
        PatchDraftTraceSummary: {
            /** Agent Name */
            agent_name: string;
            /** Model */
            model: string;
            /** Latency Ms */
            latency_ms: number;
        };
        /** ReadFileRequest */
        ReadFileRequest: {
            /** Repo Id */
            repo_id: number;
            /** Path */
            path: string;
            /**
             * Start Line
             * @default 1
             */
            start_line: number;
            /** End Line */
            end_line?: number | null;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** RepositoryCreate */
        RepositoryCreate: {
            /** Name */
            name?: string | null;
            /**
             * Source Type
             * @enum {string}
             */
            source_type: "local" | "github";
            /** Root Path */
            root_path?: string | null;
            /** Source Url */
            source_url?: string | null;
            /** Default Branch */
            default_branch?: string | null;
        };
        /** RepositoryImportJobResponse */
        RepositoryImportJobResponse: {
            repository: components["schemas"]["RepositoryRead"];
            job: components["schemas"]["JobRunRead"];
        };
        /** RepositoryIndexResponse */
        RepositoryIndexResponse: {
            /** Repo Id */
            repo_id: number;
            /**
             * Status
             * @enum {string}
             */
            status: "pending" | "ready" | "indexing" | "failed";
            /** Message */
            message: string;
            /**
             * File Count
             * @default 0
             */
            file_count: number;
            /**
             * Chunk Count
             * @default 0
             */
            chunk_count: number;
            /**
             * Skipped File Count
             * @default 0
             */
            skipped_file_count: number;
        };
        /** RepositoryIndexStatusResponse */
        RepositoryIndexStatusResponse: {
            /** Repo Id */
            repo_id: number;
            /**
             * Status
             * @enum {string}
             */
            status: "pending" | "ready" | "indexing" | "failed";
            /** Primary Language */
            primary_language: string | null;
            /** File Count */
            file_count: number;
            /** Chunk Count */
            chunk_count: number;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** RepositoryListResponse */
        RepositoryListResponse: {
            /** Items */
            items: components["schemas"]["RepositoryRead"][];
        };
        /** RepositoryRead */
        RepositoryRead: {
            /** Id */
            id: number;
            /** Name */
            name: string;
            /**
             * Source Type
             * @enum {string}
             */
            source_type: "local" | "github";
            /** Source Url */
            source_url: string | null;
            /** Root Path */
            root_path: string | null;
            /** Default Branch */
            default_branch: string | null;
            /** Primary Language */
            primary_language: string | null;
            /**
             * Status
             * @enum {string}
             */
            status: "pending" | "ready" | "indexing" | "failed";
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** RepositoryTreeNode */
        RepositoryTreeNode: {
            /** Name */
            name: string;
            /** Path */
            path: string;
            /**
             * Node Type
             * @enum {string}
             */
            node_type: "file" | "directory";
            /** Children */
            children?: components["schemas"]["RepositoryTreeNode"][];
        };
        /** RepositoryTreeResponse */
        RepositoryTreeResponse: {
            /** Repo Id */
            repo_id: number;
            /** Root Path */
            root_path: string;
            /** Path */
            path: string;
            /** Depth */
            depth: number;
            /** Nodes */
            nodes: components["schemas"]["RepositoryTreeNode"][];
        };
        /**
         * ResponseLanguage
         * @enum {string}
         */
        ResponseLanguage: "zh-CN" | "en";
        /** SearchRepoRequest */
        SearchRepoRequest: {
            /** Repo Id */
            repo_id: number;
            /** Query */
            query: string;
            /** Path Prefix */
            path_prefix?: string | null;
            /**
             * Limit
             * @default 10
             */
            limit: number;
            response_language?: components["schemas"]["ResponseLanguage"] | null;
        };
        /** ToolExecutionResponse */
        ToolExecutionResponse: {
            /** Tool Name */
            tool_name: string;
            /** Repo Id */
            repo_id: number;
            /** Items */
            items: components["schemas"]["ToolResultItem"][];
            /**
             * Truncated
             * @default false
             */
            truncated: boolean;
            /**
             * Total Matches
             * @default 0
             */
            total_matches: number;
            /** Summary */
            summary?: string | null;
        };
        /** ToolResultItem */
        ToolResultItem: {
            /**
             * Kind
             * @enum {string}
             */
            kind: "tree_node" | "search_match" | "file_segment" | "symbol_match";
            /** Path */
            path: string;
            /** Start Line */
            start_line?: number | null;
            /** End Line */
            end_line?: number | null;
            /** Language */
            language?: string | null;
            /** Content */
            content?: string | null;
            /** Score */
            score?: number | null;
            /** Symbol */
            symbol?: string | null;
            /** Symbol Type */
            symbol_type?: string | null;
            /** Node Type */
            node_type?: ("file" | "directory") | null;
            /** Depth */
            depth?: number | null;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    health_check_api_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
        };
    };
    get_meta_api_meta_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MetaResponse"];
                };
            };
        };
    };
    list_repositories_api_repositories_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RepositoryListResponse"];
                };
            };
        };
    };
    create_repository_api_repositories_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RepositoryCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RepositoryRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_repository_import_job_api_repositories_import_jobs_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RepositoryCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RepositoryImportJobResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_repository_api_repositories__repo_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                repo_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RepositoryRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_repository_tree_api_repositories__repo_id__tree_get: {
        parameters: {
            query?: {
                path?: string;
                depth?: number;
            };
            header?: {
                "X-Response-Language"?: string | null;
            };
            path: {
                repo_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RepositoryTreeResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_index_status_api_repositories__repo_id__index_status_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                repo_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RepositoryIndexStatusResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_repository_chunks_api_repositories__repo_id__chunks_get: {
        parameters: {
            query?: {
                path?: string | null;
                limit?: number;
            };
            header?: {
                "X-Response-Language"?: string | null;
            };
            path: {
                repo_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FileChunkListResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    request_index_api_repositories__repo_id__index_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path: {
                repo_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RepositoryIndexResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_index_job_api_repositories__repo_id__index_jobs_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path: {
                repo_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JobRunRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_job_api_jobs__job_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                job_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JobRunRead"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_repo_tree_api_tools_list_tree_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ListRepoTreeRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ToolExecutionResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    search_repo_api_tools_search_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SearchRepoRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ToolExecutionResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_file_api_tools_read_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReadFileRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ToolExecutionResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    find_symbol_api_tools_find_symbol_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FindSymbolRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ToolExecutionResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    ask_repository_question_api_chat_ask_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChatAskRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChatAskResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    draft_patch_api_patches_draft_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchDraftRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatchDraftResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    draft_patch_batch_api_patches_draft_batch_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchBatchDraftRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatchBatchDraftResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    apply_patch_api_patches_apply_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchApplyRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatchApplyResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    apply_patch_batch_api_patches_apply_batch_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchBatchApplyRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatchBatchApplyResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    apply_patch_and_run_checks_api_patches_apply_and_checks_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchApplyAndCheckRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatchApplyAndCheckResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    apply_patch_batch_and_run_checks_api_patches_apply_batch_and_checks_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatchBatchApplyAndCheckRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatchBatchApplyAndCheckResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_check_profiles_api_checks_repositories__repo_id__profiles_get: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path: {
                repo_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckProfileListResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    recommend_checks_api_checks_recommend_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckRecommendationRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckRecommendationResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    run_checks_api_checks_run_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Response-Language"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CheckRunRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckRunResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}

def test_openapi_exposes_core_agent_contracts(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200

    payload = response.json()
    paths = payload["paths"]
    schemas = payload["components"]["schemas"]

    for path in (
        "/api/repositories",
        "/api/repositories/import-jobs",
        "/api/repositories/{repo_id}/index",
        "/api/tools/search",
        "/api/chat/ask",
        "/api/patches/apply-and-checks",
        "/api/checks/recommend",
        "/api/repositories/{repo_id}/index-jobs",
        "/api/jobs",
        "/api/jobs/{job_id}",
        "/api/jobs/{job_id}/retry",
    ):
        assert path in paths

    patch_apply_statuses = schemas["PatchApplyResponse"]["properties"]["status"]["enum"]
    patch_batch_properties = schemas["PatchBatchApplyResponse"]["properties"]
    check_recommendation_properties = schemas["CheckRecommendationRequest"]["properties"]
    check_run_properties = schemas["CheckRunRequest"]["properties"]
    patch_apply_and_check_properties = schemas["PatchApplyAndCheckRequest"]["properties"]
    tool_search_properties = schemas["SearchRepoRequest"]["properties"]
    tool_read_properties = schemas["ReadFileRequest"]["properties"]

    assert "rolled_back" in patch_apply_statuses
    assert "rolled_back_count" in patch_batch_properties
    assert "ResponseLanguage" in schemas
    assert "response_language" in check_recommendation_properties
    assert "response_language" in check_run_properties
    assert "response_language" in patch_apply_and_check_properties
    assert "response_language" in tool_search_properties
    assert "response_language" in tool_read_properties
    assert "JobRunRead" in schemas
    assert "JobRunListResponse" in schemas
    assert "RepositoryImportJobResponse" in schemas
    assert "repository_clone" in schemas["JobRunRead"]["properties"]["job_type"]["enum"]

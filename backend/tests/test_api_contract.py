def test_openapi_exposes_core_agent_contracts(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200

    payload = response.json()
    paths = payload["paths"]
    schemas = payload["components"]["schemas"]

    for path in (
        "/api/repositories",
        "/api/repositories/{repo_id}/index",
        "/api/tools/search",
        "/api/chat/ask",
        "/api/patches/apply-and-checks",
        "/api/checks/recommend",
    ):
        assert path in paths

    patch_apply_statuses = schemas["PatchApplyResponse"]["properties"]["status"]["enum"]
    patch_batch_properties = schemas["PatchBatchApplyResponse"]["properties"]

    assert "rolled_back" in patch_apply_statuses
    assert "rolled_back_count" in patch_batch_properties

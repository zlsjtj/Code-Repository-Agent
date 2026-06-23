def test_create_and_list_local_repository(client, tmp_path):
    repository_dir = tmp_path / "sample-repo"
    repository_dir.mkdir()

    create_response = client.post(
        "/api/repositories",
        json={
            "source_type": "local",
            "root_path": str(repository_dir),
        },
    )
    assert create_response.status_code == 201

    created = create_response.json()
    assert created["name"] == "sample-repo"
    assert created["status"] == "pending"

    list_response = client.get("/api/repositories")
    assert list_response.status_code == 200
    items = list_response.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == created["id"]


def test_create_github_repository_clones_into_managed_repos(client, monkeypatch):
    from app.services.repository_service import RepositoryService

    def fake_clone(self, *, source_url, target_dir, default_branch, response_language=None):
        target_dir.mkdir(parents=True, exist_ok=True)
        (target_dir / "README.md").write_text("# cloned\n", encoding="utf-8")
        return default_branch or "main"

    monkeypatch.setattr(RepositoryService, "_clone_github_repository", fake_clone)

    create_response = client.post(
        "/api/repositories",
        json={
            "source_type": "github",
            "source_url": "https://github.com/example/demo-repo",
            "default_branch": "main",
        },
    )
    assert create_response.status_code == 201

    payload = create_response.json()
    assert payload["name"] == "demo-repo"
    assert payload["source_type"] == "github"
    assert payload["default_branch"] == "main"
    assert payload["root_path"]
    assert payload["root_path"].endswith("demo-repo")


def test_index_github_repository_after_clone(client, monkeypatch):
    from app.services.repository_service import RepositoryService

    def fake_clone(self, *, source_url, target_dir, default_branch, response_language=None):
        target_dir.mkdir(parents=True, exist_ok=True)
        (target_dir / "service.py").write_text("def greet() -> str:\n    return 'hi'\n", encoding="utf-8")
        return default_branch or "main"

    monkeypatch.setattr(RepositoryService, "_clone_github_repository", fake_clone)

    create_response = client.post(
        "/api/repositories",
        json={
            "source_type": "github",
            "source_url": "https://github.com/example/cloneable-repo",
        },
    )
    repo_id = create_response.json()["id"]

    index_response = client.post(f"/api/repositories/{repo_id}/index")
    assert index_response.status_code == 200
    payload = index_response.json()
    assert payload["status"] == "ready"
    assert payload["file_count"] == 1
    assert payload["chunk_count"] >= 1


def test_index_repository_respects_language_header(client, tmp_path):
    repository_dir = tmp_path / "localized-index-repo"
    repository_dir.mkdir()
    (repository_dir / "service.py").write_text("def greet() -> str:\n    return 'hi'\n", encoding="utf-8")

    create_response = client.post(
        "/api/repositories",
        json={
            "source_type": "local",
            "root_path": str(repository_dir),
        },
    )
    repo_id = create_response.json()["id"]

    index_response = client.post(
        f"/api/repositories/{repo_id}/index",
        headers={"X-Response-Language": "zh-CN"},
    )
    assert index_response.status_code == 200
    assert index_response.json()["message"] == "已完成索引：扫描 1 个文件，生成 1 个片段。"


def test_list_chunks_respects_language_header_for_missing_repository(client):
    response = client.get(
        "/api/repositories/999/chunks",
        headers={"X-Response-Language": "zh-CN"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "未找到仓库 #999。"


def test_get_repository_respects_language_header_for_missing_repository(client):
    response = client.get(
        "/api/repositories/999",
        headers={"X-Response-Language": "zh-CN"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "未找到仓库 #999。"


def test_index_status_respects_language_header_for_missing_repository(client):
    response = client.get(
        "/api/repositories/999/index-status",
        headers={"X-Response-Language": "zh-CN"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "未找到仓库 #999。"


def test_create_github_repository_rejects_non_github_host(client):
    response = client.post(
        "/api/repositories",
        json={
            "source_type": "github",
            "source_url": "https://example.com/not-github/repo",
        },
        headers={"X-Response-Language": "zh-CN"},
    )

    assert response.status_code == 400
    assert "只允许克隆配置白名单中的 Git 主机" in response.json()["detail"]


def test_import_job_endpoint_rejects_local_repository_with_localized_message(client, tmp_path):
    repository_dir = tmp_path / "local-import-job"
    repository_dir.mkdir()

    response = client.post(
        "/api/repositories/import-jobs",
        json={
            "source_type": "local",
            "root_path": str(repository_dir),
        },
        headers={"X-Response-Language": "zh-CN"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "只有 GitHub 仓库可以使用后台导入任务接口。"

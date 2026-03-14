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

    def fake_clone(self, *, source_url, target_dir, default_branch):
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

    def fake_clone(self, *, source_url, target_dir, default_branch):
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

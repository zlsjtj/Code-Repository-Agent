from app.services.job_service import JobService
from app.services.repository_service import RepositoryService


def test_create_index_job_and_query_status(client, tmp_path, monkeypatch):
    repository_dir = tmp_path / "job-repo"
    repository_dir.mkdir()
    (repository_dir / "main.py").write_text("print('hello')\n", encoding="utf-8")

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]

    def run_inline(self, job_id, response_language):
        self._run_repository_index_job(job_id, response_language)

    monkeypatch.setattr(JobService, "_submit_job", run_inline)

    job_response = client.post(
        f"/api/repositories/{repo_id}/index-jobs",
        headers={"X-Response-Language": "zh-CN"},
    )
    assert job_response.status_code == 202
    payload = job_response.json()
    assert payload["job_type"] == "repository_index"
    assert payload["status"] == "queued"

    get_response = client.get(f"/api/jobs/{payload['id']}")
    assert get_response.status_code == 200
    fetched = get_response.json()
    assert fetched["status"] == "succeeded"
    assert fetched["file_count"] == 1
    assert fetched["chunk_count"] >= 1


def test_create_github_import_job_and_query_status(client, monkeypatch):
    def run_clone_inline(self, job_id, response_language):
        self._run_repository_clone_job(job_id, response_language)

    def fake_clone(self, *, source_url, target_dir, default_branch, response_language=None):
        target_dir.mkdir(parents=True, exist_ok=True)
        (target_dir / "README.md").write_text("# cloned\n", encoding="utf-8")
        return default_branch or "main"

    monkeypatch.setattr(JobService, "_submit_clone_job", run_clone_inline)
    monkeypatch.setattr(RepositoryService, "_clone_github_repository", fake_clone)

    response = client.post(
        "/api/repositories/import-jobs",
        json={
            "source_type": "github",
            "source_url": "https://github.com/example/async-demo-repo",
            "default_branch": "main",
        },
        headers={"X-Response-Language": "zh-CN"},
    )
    assert response.status_code == 202

    payload = response.json()
    assert payload["repository"]["name"] == "async-demo-repo"
    assert payload["repository"]["root_path"] is None
    assert payload["repository"]["status"] == "cloning"
    assert payload["job"]["job_type"] == "repository_clone"
    assert payload["job"]["status"] == "queued"

    job_response = client.get(f"/api/jobs/{payload['job']['id']}")
    assert job_response.status_code == 200
    assert job_response.json()["status"] == "succeeded"

    repo_response = client.get(f"/api/repositories/{payload['repository']['id']}")
    assert repo_response.status_code == 200
    repo_payload = repo_response.json()
    assert repo_payload["root_path"]
    assert repo_payload["default_branch"] == "main"
    assert repo_payload["status"] == "pending"


def test_retry_failed_index_job(client, tmp_path, monkeypatch):
    repository_dir = tmp_path / "retry-job-repo"
    repository_dir.mkdir()
    (repository_dir / "main.py").write_text("print('hello')\n", encoding="utf-8")

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]

    from app.schemas.repository import RepositoryIndexResponse
    from app.services.indexing_service import IndexingService

    calls = {"count": 0}

    def run_index_inline(self, job_id, response_language):
        self._run_repository_index_job(job_id, response_language)

    def flaky_index(self, repository, response_language=None):
        calls["count"] += 1
        if calls["count"] == 1:
            raise RuntimeError("boom")
        repository.status = "ready"
        return RepositoryIndexResponse(
            repo_id=repository.id,
            status="ready",
            message="Indexed after retry.",
            file_count=1,
            chunk_count=1,
            skipped_file_count=0,
        )

    monkeypatch.setattr(JobService, "_submit_job", run_index_inline)
    monkeypatch.setattr(IndexingService, "request_index", flaky_index)

    first_job = client.post(f"/api/repositories/{repo_id}/index-jobs")
    assert first_job.status_code == 202
    first_payload = client.get(f"/api/jobs/{first_job.json()['id']}").json()
    assert first_payload["status"] == "failed"

    retry_response = client.post(f"/api/jobs/{first_job.json()['id']}/retry")
    assert retry_response.status_code == 200
    retry_payload = retry_response.json()
    assert retry_payload["job_type"] == "repository_index"
    assert retry_payload["status"] == "queued"

    fetched_retry = client.get(f"/api/jobs/{retry_payload['id']}").json()
    assert fetched_retry["status"] == "succeeded"

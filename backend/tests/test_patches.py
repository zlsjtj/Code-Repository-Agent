import hashlib

from app.agents.patch_draft_agent import PatchDraftFinalOutput
from app.services.patch_service import PatchService


def test_patch_draft_returns_unified_diff(client, tmp_path, monkeypatch):
    repository_dir = tmp_path / "patch-repo"
    repository_dir.mkdir()
    (repository_dir / "service.py").write_text(
        "\n".join(
            [
                "def greet(name: str) -> str:",
                '    return "hello"',
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    async def fake_run_agent(self, *, prompt, model):
        return (
            PatchDraftFinalOutput(
                summary="让函数真正使用传入的 name。",
                rationale="这是最小改动，只修正返回值，不改动签名。",
                proposed_content=(
                    "def greet(name: str) -> str:\n"
                    '    return f"hello {name}"\n'
                ),
                warnings=["还没有运行测试，请在应用 patch 前补一次验证。"],
            ),
            "PatchDraftAssistant",
        )

    monkeypatch.setattr(PatchService, "_run_agent", fake_run_agent)

    response = client.post(
        "/api/patches/draft",
        json={
            "repo_id": repo_id,
            "target_path": "service.py",
            "instruction": "让 greet 返回包含 name 的问候语。",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["target_path"] == "service.py"
    assert payload["base_content_sha256"]
    assert payload["summary"] == "让函数真正使用传入的 name。"
    assert "--- a/service.py" in payload["unified_diff"]
    assert 'return f"hello {name}"' in payload["proposed_content"]
    assert payload["trace_summary"]["agent_name"] == "PatchDraftAssistant"


def test_patch_apply_writes_file_when_hash_matches(client, tmp_path):
    repository_dir = tmp_path / "apply-repo"
    repository_dir.mkdir()
    target_file = repository_dir / "service.py"
    target_file.write_text(
        "\n".join(
            [
                "def greet(name: str) -> str:",
                '    return "hello"',
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]
    expected_base_sha256 = hashlib.sha256(target_file.read_text(encoding="utf-8").encode("utf-8")).hexdigest()

    apply_response = client.post(
        "/api/patches/apply",
        json={
            "repo_id": repo_id,
            "target_path": "service.py",
            "expected_base_sha256": expected_base_sha256,
            "proposed_content": "def greet(name: str) -> str:\n    return f\"hello {name}\"\n",
        },
    )

    assert apply_response.status_code == 200
    payload = apply_response.json()
    assert payload["status"] == "applied"
    assert target_file.read_text(encoding="utf-8") == "def greet(name: str) -> str:\n    return f\"hello {name}\"\n"
    assert "--- a/service.py" in payload["unified_diff"]
    assert payload["written_line_count"] == 2


def test_patch_apply_rejects_stale_draft(client, tmp_path):
    repository_dir = tmp_path / "stale-repo"
    repository_dir.mkdir()
    target_file = repository_dir / "service.py"
    target_file.write_text("value = 1\n", encoding="utf-8")

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]
    expected_base_sha256 = hashlib.sha256(target_file.read_text(encoding="utf-8").encode("utf-8")).hexdigest()

    target_file.write_text("value = 2\n", encoding="utf-8")

    apply_response = client.post(
        "/api/patches/apply",
        json={
            "repo_id": repo_id,
            "target_path": "service.py",
            "expected_base_sha256": expected_base_sha256,
            "proposed_content": "value = 3\n",
        },
    )

    assert apply_response.status_code == 409
    assert "changed since this draft was generated" in apply_response.json()["detail"]

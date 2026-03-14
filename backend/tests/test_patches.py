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
    assert payload["summary"] == "让函数真正使用传入的 name。"
    assert "--- a/service.py" in payload["unified_diff"]
    assert 'return f"hello {name}"' in payload["proposed_content"]
    assert payload["trace_summary"]["agent_name"] == "PatchDraftAssistant"

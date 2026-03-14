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


def test_patch_batch_draft_returns_grouped_file_previews(client, tmp_path, monkeypatch):
    repository_dir = tmp_path / "patch-batch-repo"
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
    (repository_dir / "config.py").write_text("FEATURE_FLAG = False\n", encoding="utf-8")

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    async def fake_run_agent(self, *, prompt, model):
        if "Target file: service.py" in prompt:
            return (
                PatchDraftFinalOutput(
                    summary="让 greet 真正返回 name。",
                    rationale="只改函数体，保持签名不变。",
                    proposed_content=(
                        "def greet(name: str) -> str:\n"
                        '    return f"hello {name}"\n'
                    ),
                    warnings=[],
                ),
                "PatchDraftAssistant",
            )

        if "Target file: config.py" in prompt:
            return (
                PatchDraftFinalOutput(
                    summary="打开功能开关。",
                    rationale="配置项只做布尔切换，不引入额外结构。",
                    proposed_content="FEATURE_FLAG = True\n",
                    warnings=["请确认这个开关在目标环境中可安全开启。"],
                ),
                "PatchDraftAssistant",
            )

        raise AssertionError(f"Unexpected prompt: {prompt}")

    monkeypatch.setattr(PatchService, "_run_agent", fake_run_agent)

    response = client.post(
        "/api/patches/draft-batch",
        json={
            "repo_id": repo_id,
            "target_paths": ["service.py", "config.py", "service.py"],
            "instruction": "给这两个文件都做最小必要改动。",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["target_paths"] == ["service.py", "config.py"]
    assert payload["changed_file_count"] == 2
    assert len(payload["items"]) == 2
    assert payload["items"][0]["target_path"] == "service.py"
    assert payload["items"][1]["target_path"] == "config.py"
    assert "--- a/service.py" in payload["combined_unified_diff"]
    assert "--- a/config.py" in payload["combined_unified_diff"]
    assert any("Skipped duplicate target path" in warning for warning in payload["warnings"])
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


def test_patch_batch_apply_writes_multiple_files_when_hashes_match(client, tmp_path):
    repository_dir = tmp_path / "apply-batch-repo"
    repository_dir.mkdir()
    service_file = repository_dir / "service.py"
    config_file = repository_dir / "config.py"
    service_file.write_text('def greet() -> str:\n    return "hello"\n', encoding="utf-8")
    config_file.write_text("FEATURE_FLAG = False\n", encoding="utf-8")

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]

    response = client.post(
        "/api/patches/apply-batch",
        json={
            "repo_id": repo_id,
            "items": [
                {
                    "target_path": "service.py",
                    "expected_base_sha256": hashlib.sha256(
                        service_file.read_text(encoding="utf-8").encode("utf-8")
                    ).hexdigest(),
                    "proposed_content": 'def greet() -> str:\n    return "hello codex"\n',
                },
                {
                    "target_path": "config.py",
                    "expected_base_sha256": hashlib.sha256(
                        config_file.read_text(encoding="utf-8").encode("utf-8")
                    ).hexdigest(),
                    "proposed_content": "FEATURE_FLAG = True\n",
                },
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "applied"
    assert payload["applied_count"] == 2
    assert payload["noop_count"] == 0
    assert service_file.read_text(encoding="utf-8") == 'def greet() -> str:\n    return "hello codex"\n'
    assert config_file.read_text(encoding="utf-8") == "FEATURE_FLAG = True\n"
    assert "--- a/service.py" in payload["combined_unified_diff"]
    assert "--- a/config.py" in payload["combined_unified_diff"]


def test_patch_batch_apply_rejects_stale_file_before_writing_anything(client, tmp_path):
    repository_dir = tmp_path / "apply-batch-stale-repo"
    repository_dir.mkdir()
    service_file = repository_dir / "service.py"
    config_file = repository_dir / "config.py"
    service_file.write_text("value = 1\n", encoding="utf-8")
    config_file.write_text("FEATURE_FLAG = False\n", encoding="utf-8")

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]
    service_hash = hashlib.sha256(service_file.read_text(encoding="utf-8").encode("utf-8")).hexdigest()
    config_hash = hashlib.sha256(config_file.read_text(encoding="utf-8").encode("utf-8")).hexdigest()

    config_file.write_text("FEATURE_FLAG = True\n", encoding="utf-8")

    response = client.post(
        "/api/patches/apply-batch",
        json={
            "repo_id": repo_id,
            "items": [
                {
                    "target_path": "service.py",
                    "expected_base_sha256": service_hash,
                    "proposed_content": "value = 2\n",
                },
                {
                    "target_path": "config.py",
                    "expected_base_sha256": config_hash,
                    "proposed_content": "FEATURE_FLAG = MAYBE\n",
                },
            ],
        },
    )

    assert response.status_code == 409
    assert "config.py" in response.json()["detail"]
    assert service_file.read_text(encoding="utf-8") == "value = 1\n"
    assert config_file.read_text(encoding="utf-8") == "FEATURE_FLAG = True\n"


def test_patch_apply_and_checks_runs_closed_loop(client, tmp_path):
    repository_dir = tmp_path / "closed-loop-repo"
    backend_dir = repository_dir / "backend"
    tests_dir = backend_dir / "tests"
    tests_dir.mkdir(parents=True)
    target_file = backend_dir / "service.py"
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
    (backend_dir / "pyproject.toml").write_text("[project]\nname='demo'\nversion='0.1.0'\n", encoding="utf-8")
    (tests_dir / "test_service.py").write_text(
        "\n".join(
            [
                "from service import greet",
                "",
                "def test_greet_uses_name():",
                '    assert greet("Codex") == "hello Codex"',
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

    response = client.post(
        "/api/patches/apply-and-checks",
        json={
            "repo_id": repo_id,
            "target_path": "backend/service.py",
            "expected_base_sha256": expected_base_sha256,
            "proposed_content": 'def greet(name: str) -> str:\n    return f"hello {name}"\n',
            "profile_ids": ["backend_pytest"],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["patch"]["status"] == "applied"
    assert payload["checks"]["status"] == "passed"
    assert payload["checks"]["results"][0]["id"] == "backend_pytest"


def test_patch_batch_apply_and_checks_runs_closed_loop(client, tmp_path):
    repository_dir = tmp_path / "closed-loop-batch-repo"
    backend_dir = repository_dir / "backend"
    tests_dir = backend_dir / "tests"
    tests_dir.mkdir(parents=True)
    service_file = backend_dir / "service.py"
    config_file = backend_dir / "config.py"
    service_file.write_text(
        "\n".join(
            [
                "def greet(name: str) -> str:",
                '    return "hello"',
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    config_file.write_text("FEATURE_FLAG = False\n", encoding="utf-8")
    (backend_dir / "pyproject.toml").write_text("[project]\nname='demo'\nversion='0.1.0'\n", encoding="utf-8")
    (tests_dir / "test_service.py").write_text(
        "\n".join(
            [
                "from service import greet",
                "",
                "def test_greet_uses_name():",
                '    assert greet("Codex") == "hello Codex"',
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

    response = client.post(
        "/api/patches/apply-batch-and-checks",
        json={
            "repo_id": repo_id,
            "items": [
                {
                    "target_path": "backend/service.py",
                    "expected_base_sha256": hashlib.sha256(
                        service_file.read_text(encoding="utf-8").encode("utf-8")
                    ).hexdigest(),
                    "proposed_content": 'def greet(name: str) -> str:\n    return f"hello {name}"\n',
                },
                {
                    "target_path": "backend/config.py",
                    "expected_base_sha256": hashlib.sha256(
                        config_file.read_text(encoding="utf-8").encode("utf-8")
                    ).hexdigest(),
                    "proposed_content": "FEATURE_FLAG = True\n",
                },
            ],
            "profile_ids": ["backend_pytest"],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["patch"]["status"] == "applied"
    assert payload["patch"]["applied_count"] == 2
    assert payload["checks"]["status"] == "passed"
    assert payload["checks"]["results"][0]["id"] == "backend_pytest"

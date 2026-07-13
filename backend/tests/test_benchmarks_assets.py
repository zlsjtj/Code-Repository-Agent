import importlib.util
import json
from pathlib import Path
import sys


REPO_ROOT = Path(__file__).resolve().parents[2]
RUNNER_FILE = REPO_ROOT / "benchmarks" / "run_smoke_cases.py"


def load_smoke_runner():
    spec = importlib.util.spec_from_file_location("codeatlas_smoke_runner", RUNNER_FILE)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_smoke_benchmark_cases_have_expected_shape():
    benchmark_file = REPO_ROOT / "benchmarks" / "smoke_cases.json"
    payload = json.loads(benchmark_file.read_text(encoding="utf-8"))

    assert isinstance(payload, list)
    assert len(payload) >= 3

    for item in payload:
        assert item["id"]
        assert item["repo"]
        assert item["question"]
        assert isinstance(item["expected_paths"], list)
        assert item["expected_paths"]
        assert all(isinstance(path, str) and path for path in item["expected_paths"])


def test_smoke_runner_matches_normalized_citation_paths():
    runner = load_smoke_runner()
    case = runner.SmokeCase(
        id="path-check",
        repo="self",
        question="Where is indexing implemented?",
        expected_paths=(
            "backend/app/api/routes/repositories.py",
            "backend/app/services/indexing_service.py",
        ),
    )
    response = {
        "citations": [
            {"path": ".\\backend\\app\\api\\routes\\repositories.py"},
            {"path": "backend/app/services/indexing_service.py"},
        ]
    }

    assert runner.find_missing_paths(case, response) == []


def test_smoke_runner_returns_failure_when_a_citation_is_missing(monkeypatch, capsys):
    runner = load_smoke_runner()
    case = runner.SmokeCase(
        id="path-check",
        repo="self",
        question="Where is indexing implemented?",
        expected_paths=("backend/app/services/indexing_service.py",),
    )

    monkeypatch.setattr(runner, "ask_question", lambda **_: {"citations": []})

    exit_code = runner.run_cases(
        [case],
        base_url="http://localhost:8000",
        repo_id=1,
        language="en",
        timeout=1,
    )

    assert exit_code == 1
    assert "missing citations" in capsys.readouterr().out

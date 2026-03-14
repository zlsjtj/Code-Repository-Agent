import json
from pathlib import Path


def test_smoke_benchmark_cases_have_expected_shape():
    benchmark_file = Path(__file__).resolve().parents[2] / "benchmarks" / "smoke_cases.json"
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

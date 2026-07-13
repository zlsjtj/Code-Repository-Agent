from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_CASES_FILE = Path(__file__).with_name("smoke_cases.json")


@dataclass(frozen=True)
class SmokeCase:
    id: str
    repo: str
    question: str
    expected_paths: tuple[str, ...]


def load_cases(path: Path) -> list[SmokeCase]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, list) or not payload:
        raise ValueError("Smoke case file must contain a non-empty JSON list.")

    cases: list[SmokeCase] = []
    seen_ids: set[str] = set()
    for index, item in enumerate(payload, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Case {index} must be a JSON object.")

        case_id = _required_string(item, "id", index)
        if case_id in seen_ids:
            raise ValueError(f"Duplicate case id: {case_id}")
        seen_ids.add(case_id)

        expected_paths = item.get("expected_paths")
        if not isinstance(expected_paths, list) or not expected_paths:
            raise ValueError(f"Case '{case_id}' must define at least one expected path.")
        if not all(isinstance(value, str) and value.strip() for value in expected_paths):
            raise ValueError(f"Case '{case_id}' contains an invalid expected path.")

        cases.append(
            SmokeCase(
                id=case_id,
                repo=_required_string(item, "repo", index),
                question=_required_string(item, "question", index),
                expected_paths=tuple(expected_paths),
            )
        )
    return cases


def ask_question(
    *,
    base_url: str,
    repo_id: int,
    case: SmokeCase,
    language: str,
    timeout: float,
) -> dict[str, Any]:
    body = json.dumps(
        {
            "repo_id": repo_id,
            "question": case.question,
            "response_language": language,
        }
    ).encode("utf-8")
    request = Request(
        f"{base_url.rstrip('/')}/api/chat/ask",
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "CodeAtlas-smoke-runner"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=timeout) as response:
            payload = json.load(response)
    except HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"HTTP {exc.code}: {details}") from exc
    except URLError as exc:
        raise RuntimeError(f"Could not reach CodeAtlas backend: {exc.reason}") from exc

    if not isinstance(payload, dict) or not isinstance(payload.get("citations"), list):
        raise RuntimeError("Chat response does not contain a citations list.")
    return payload


def find_missing_paths(case: SmokeCase, response: dict[str, Any]) -> list[str]:
    cited_paths = {
        _normalize_path(citation.get("path", ""))
        for citation in response.get("citations", [])
        if isinstance(citation, dict)
    }
    return [path for path in case.expected_paths if _normalize_path(path) not in cited_paths]


def run_cases(
    cases: list[SmokeCase],
    *,
    base_url: str,
    repo_id: int,
    language: str,
    timeout: float,
) -> int:
    passed = 0
    for case in cases:
        try:
            response = ask_question(
                base_url=base_url,
                repo_id=repo_id,
                case=case,
                language=language,
                timeout=timeout,
            )
            missing_paths = find_missing_paths(case, response)
        except (RuntimeError, ValueError, json.JSONDecodeError) as exc:
            print(f"[FAIL] {case.id}: {exc}")
            continue

        if missing_paths:
            print(f"[FAIL] {case.id}: missing citations: {', '.join(missing_paths)}")
            continue

        passed += 1
        print(f"[PASS] {case.id}: matched {len(case.expected_paths)} expected citations")

    print(f"\nSummary: {passed}/{len(cases)} cases passed")
    return 0 if passed == len(cases) else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run CodeAtlas question-and-citation smoke cases against a live backend."
    )
    parser.add_argument("--repo-id", type=_positive_int, required=True, help="Indexed repository id")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--cases", type=Path, default=DEFAULT_CASES_FILE, help="Smoke case JSON file")
    parser.add_argument("--language", choices=("zh-CN", "en"), default="zh-CN")
    parser.add_argument("--timeout", type=float, default=120.0, help="Timeout per question in seconds")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        cases = load_cases(args.cases)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Could not load smoke cases: {exc}", file=sys.stderr)
        return 2

    return run_cases(
        cases,
        base_url=args.base_url,
        repo_id=args.repo_id,
        language=args.language,
        timeout=args.timeout,
    )


def _required_string(item: dict[str, Any], field: str, index: int) -> str:
    value = item.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Case {index} must define a non-empty '{field}'.")
    return value.strip()


def _normalize_path(path: str) -> str:
    normalized = path.strip().replace("\\", "/")
    while normalized.startswith("./"):
        normalized = normalized[2:]
    return normalized


def _positive_int(value: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return parsed


if __name__ == "__main__":
    raise SystemExit(main())

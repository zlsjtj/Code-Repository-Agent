from __future__ import annotations

import os
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

IGNORED_DIRECTORY_NAMES = {
    ".git",
    ".hg",
    ".svn",
    ".next",
    ".turbo",
    ".venv",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "target",
    "venv",
}
MAX_FILE_BYTES = 512 * 1024

LANGUAGE_BY_SUFFIX = {
    ".c": "c",
    ".cc": "cpp",
    ".cpp": "cpp",
    ".css": "css",
    ".cs": "csharp",
    ".go": "go",
    ".h": "c",
    ".hpp": "cpp",
    ".html": "html",
    ".ini": "ini",
    ".java": "java",
    ".js": "javascript",
    ".json": "json",
    ".jsx": "javascript",
    ".md": "markdown",
    ".php": "php",
    ".ps1": "powershell",
    ".py": "python",
    ".rb": "ruby",
    ".rs": "rust",
    ".scss": "scss",
    ".sh": "shell",
    ".sql": "sql",
    ".toml": "toml",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".txt": "text",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
}
LANGUAGE_BY_NAME = {
    "Dockerfile": "dockerfile",
    "Makefile": "makefile",
}


@dataclass(slots=True)
class ScannedFile:
    absolute_path: Path
    relative_path: str
    text: str
    language: str | None
    size_bytes: int
    line_count: int


@dataclass(slots=True)
class ScanResult:
    files: list[ScannedFile]
    skipped_file_count: int
    primary_language: str | None
    language_counts: Counter[str] = field(default_factory=Counter)

    @property
    def file_count(self) -> int:
        return len(self.files)


class RepositoryScanner:
    def should_ignore_directory(self, name: str) -> bool:
        return name in IGNORED_DIRECTORY_NAMES

    def should_skip_file(self, path: Path) -> bool:
        try:
            if not path.is_file():
                return True
            if path.stat().st_size > MAX_FILE_BYTES:
                return True
        except OSError:
            return True
        return self._is_binary(path)

    def scan(self, root: Path) -> ScanResult:
        files: list[ScannedFile] = []
        language_counts: Counter[str] = Counter()
        skipped_file_count = 0

        for current_root, dir_names, file_names in os.walk(root):
            dir_names[:] = sorted(
                directory_name
                for directory_name in dir_names
                if not self.should_ignore_directory(directory_name)
            )

            for file_name in sorted(file_names):
                candidate = Path(current_root) / file_name
                if self.should_skip_file(candidate):
                    skipped_file_count += 1
                    continue

                try:
                    text = candidate.read_text(encoding="utf-8")
                except (OSError, UnicodeDecodeError):
                    skipped_file_count += 1
                    continue

                if not text.strip():
                    continue

                line_count = max(1, len(text.splitlines()))
                language = self._detect_language(candidate)
                if language:
                    language_counts[language] += line_count

                files.append(
                    ScannedFile(
                        absolute_path=candidate,
                        relative_path=candidate.relative_to(root).as_posix(),
                        text=text,
                        language=language,
                        size_bytes=candidate.stat().st_size if candidate.exists() else 0,
                        line_count=line_count,
                    )
                )

        primary_language = language_counts.most_common(1)[0][0] if language_counts else None
        return ScanResult(
            files=files,
            skipped_file_count=skipped_file_count,
            primary_language=primary_language,
            language_counts=language_counts,
        )

    def _detect_language(self, path: Path) -> str | None:
        return LANGUAGE_BY_NAME.get(path.name) or LANGUAGE_BY_SUFFIX.get(path.suffix.lower())

    def _is_binary(self, path: Path) -> bool:
        try:
            with path.open("rb") as handle:
                sample = handle.read(8192)
        except OSError:
            return True

        if b"\x00" in sample:
            return True

        try:
            sample.decode("utf-8")
        except UnicodeDecodeError:
            return True
        return False

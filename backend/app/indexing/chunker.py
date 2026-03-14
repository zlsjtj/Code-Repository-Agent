from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha1


@dataclass(slots=True)
class LineChunk:
    chunk_index: int
    start_line: int
    end_line: int
    text: str

    @property
    def hash_value(self) -> str:
        return sha1(f"{self.chunk_index}:{self.start_line}:{self.end_line}:{self.text}".encode("utf-8")).hexdigest()


class LineChunker:
    def __init__(self, *, max_lines: int = 80, overlap_lines: int = 20):
        if overlap_lines >= max_lines:
            raise ValueError("overlap_lines must be smaller than max_lines.")
        self.max_lines = max_lines
        self.overlap_lines = overlap_lines

    def chunk_text(self, text: str) -> list[LineChunk]:
        lines = text.splitlines()
        if not lines:
            return []

        chunks: list[LineChunk] = []
        step = self.max_lines - self.overlap_lines
        start_index = 0

        while start_index < len(lines):
            end_index = min(start_index + self.max_lines, len(lines))
            chunk_text = "\n".join(lines[start_index:end_index]).strip("\n")
            if chunk_text.strip():
                chunks.append(
                    LineChunk(
                        chunk_index=len(chunks),
                        start_line=start_index + 1,
                        end_line=end_index,
                        text=chunk_text,
                    )
                )

            if end_index >= len(lines):
                break
            start_index += step

        return chunks

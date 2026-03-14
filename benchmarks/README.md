# Benchmarks

This folder stores lightweight evaluation assets for the repository agent.

Current scope:

- `smoke_cases.json`: a small hand-written regression set for question answering
- fixture validation in backend tests to keep the benchmark schema stable

Suggested workflow:

1. Add a new case when a retrieval or answer regression is found.
2. Keep the question concrete and repository-specific.
3. Record the file paths that should appear in citations or tool traces.
4. Expand this into executable eval scripts once the benchmark set is large enough.

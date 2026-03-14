from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.db import get_engine, get_session_factory


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    db_path = tmp_path / "test.db"
    data_dir = tmp_path / "data"
    repos_dir = tmp_path / "repos"

    monkeypatch.setenv("CODE_AGENT_DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("CODE_AGENT_DATA_DIR", data_dir.as_posix())
    monkeypatch.setenv("CODE_AGENT_REPOS_DIR", repos_dir.as_posix())

    get_settings.cache_clear()
    get_engine.cache_clear()
    get_session_factory.cache_clear()

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client

    get_settings.cache_clear()
    get_engine.cache_clear()
    get_session_factory.cache_clear()


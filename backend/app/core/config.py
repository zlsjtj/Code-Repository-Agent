from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_prefix="CODE_AGENT_",
        extra="ignore",
    )

    app_name: str = "Code Repository Agent"
    app_version: str = "0.1.0"
    debug: bool = True
    api_prefix: str = "/api"
    database_url: str | None = None
    database_path: str = "data/code_repo_agent.db"
    data_dir: str = "data"
    repos_dir: str = "repos"
    openai_model: str = "gpt-4.1-mini"
    git_clone_timeout_seconds: int = 180
    git_clone_depth: int = 1
    check_command_timeout_seconds: int = 120
    check_output_char_limit: int = 4000
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    def resolve_path(self, raw_path: str) -> Path:
        path = Path(raw_path)
        return path if path.is_absolute() else BASE_DIR / path

    @property
    def resolved_database_path(self) -> Path:
        return self.resolve_path(self.database_path)

    @property
    def resolved_data_dir(self) -> Path:
        return self.resolve_path(self.data_dir)

    @property
    def resolved_repos_dir(self) -> Path:
        return self.resolve_path(self.repos_dir)

    @property
    def sqlalchemy_database_url(self) -> str:
        return self.database_url or f"sqlite:///{self.resolved_database_path.as_posix()}"


@lru_cache
def get_settings() -> Settings:
    return Settings()

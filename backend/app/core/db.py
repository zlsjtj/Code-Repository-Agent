from datetime import datetime, timezone
from functools import lru_cache
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


@lru_cache
def get_engine():
    settings = get_settings()
    connect_args = {}
    if settings.sqlalchemy_database_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(settings.sqlalchemy_database_url, connect_args=connect_args)


@lru_cache
def get_session_factory():
    return sessionmaker(
        bind=get_engine(),
        autoflush=False,
        autocommit=False,
        expire_on_commit=False,
        class_=Session,
    )


def get_db() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def init_db() -> None:
    from app.models import conversation_trace, file_chunk, repository  # noqa: F401

    settings = get_settings()
    settings.resolved_data_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=get_engine())


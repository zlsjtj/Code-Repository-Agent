from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, utc_now

if TYPE_CHECKING:
    from app.models.conversation_trace import ConversationTrace
    from app.models.file_chunk import FileChunk


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    root_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_branch: Mapped[str | None] = mapped_column(String(120), nullable=True)
    primary_language: Mapped[str | None] = mapped_column(String(80), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    file_chunks: Mapped[list["FileChunk"]] = relationship(
        back_populates="repository",
        cascade="all, delete-orphan",
    )
    conversation_traces: Mapped[list["ConversationTrace"]] = relationship(
        back_populates="repository",
        cascade="all, delete-orphan",
    )


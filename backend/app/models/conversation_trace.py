from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, utc_now

if TYPE_CHECKING:
    from app.models.repository import Repository


class ConversationTrace(Base):
    __tablename__ = "conversation_traces"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    repo_id: Mapped[int | None] = mapped_column(ForeignKey("repositories.id", ondelete="SET NULL"), nullable=True)
    user_query: Mapped[str] = mapped_column(Text, nullable=False)
    tool_calls_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    citations_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    final_answer: Mapped[str] = mapped_column(Text, nullable=False, default="")
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    repository: Mapped["Repository | None"] = relationship(back_populates="conversation_traces")


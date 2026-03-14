from __future__ import annotations

import json
import os
from time import perf_counter
from uuid import uuid4

from agents import Runner
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.agents.code_assistant import (
    CodeAssistantFinalOutput,
    CodeAssistantRunContext,
    build_code_assistant_agent,
)
from app.core.config import get_settings
from app.models.conversation_trace import ConversationTrace
from app.models.file_chunk import FileChunk
from app.models.repository import Repository
from app.schemas.chat import ChatAskRequest, ChatAskResponse, ChatTraceStep, ChatTraceSummary
from app.services.repository_service import RepositoryService, RepositoryValidationError
from app.tools.repository_tools import RepositoryTools


class ChatConfigurationError(ValueError):
    """Raised when the chat runtime is not configured correctly."""


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.repository_service = RepositoryService(db)

    async def ask(self, payload: ChatAskRequest) -> ChatAskResponse:
        settings = get_settings()
        if not os.getenv("OPENAI_API_KEY"):
            raise ChatConfigurationError("OPENAI_API_KEY is not configured. Set it before calling /api/chat/ask.")

        repository = self.repository_service.get_repository(payload.repo_id)
        self._validate_repository_for_chat(repository)

        session_id = payload.session_id or uuid4().hex
        runtime = RepositoryTools(self.db)
        run_context = CodeAssistantRunContext(
            repo_id=repository.id,
            repo_name=repository.name,
            tool_runtime=runtime,
        )

        user_input = self._build_user_input(repository, payload.question)
        started_at = perf_counter()
        final_output, agent_name = await self._run_agent(
            user_input=user_input,
            run_context=run_context,
            model=settings.openai_model,
        )
        latency_ms = int((perf_counter() - started_at) * 1000)

        trace_summary = ChatTraceSummary(
            agent_name=agent_name,
            model=settings.openai_model,
            latency_ms=latency_ms,
            tool_call_count=len(run_context.tool_events),
            steps=[ChatTraceStep(**event) for event in run_context.tool_events],
        )

        trace = ConversationTrace(
            session_id=session_id,
            repo_id=repository.id,
            user_query=payload.question,
            tool_calls_json=json.dumps(run_context.tool_events, ensure_ascii=False),
            citations_json=json.dumps([citation.model_dump() for citation in final_output.citations], ensure_ascii=False),
            final_answer=final_output.answer,
            latency_ms=latency_ms,
        )
        self.db.add(trace)
        self.db.commit()

        return ChatAskResponse(
            session_id=session_id,
            answer=final_output.answer,
            citations=final_output.citations,
            trace_summary=trace_summary,
        )

    async def _run_agent(
        self,
        *,
        user_input: str,
        run_context: CodeAssistantRunContext,
        model: str,
    ) -> tuple[CodeAssistantFinalOutput, str]:
        agent = build_code_assistant_agent(model)
        result = await Runner.run(agent, user_input, context=run_context)
        final_output = result.final_output
        if not isinstance(final_output, CodeAssistantFinalOutput):
            raise ChatConfigurationError("The code assistant returned an unexpected output type.")

        agent_name = getattr(getattr(result, "last_agent", None), "name", agent.name)
        return final_output, agent_name

    def _validate_repository_for_chat(self, repository: Repository) -> None:
        self.repository_service.resolve_repository_root(repository)
        if repository.status != "ready":
            raise RepositoryValidationError("Index the repository first before asking questions.")

        chunk_count = int(
            self.db.scalar(select(func.count(FileChunk.id)).where(FileChunk.repo_id == repository.id)) or 0
        )
        if chunk_count == 0:
            raise RepositoryValidationError("The repository has no indexed chunks yet. Trigger indexing first.")

    def _build_user_input(self, repository: Repository, question: str) -> str:
        root_path = repository.root_path or "(unknown)"
        return (
            f"Repository name: {repository.name}\n"
            f"Repository root: {root_path}\n"
            f"User question: {question}"
        )

from __future__ import annotations

import logging
import shutil
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy.orm import Session

from app.core.db import get_session_factory, utc_now
from app.models.job_run import JobRun
from app.models.repository import Repository
from app.schemas.common import ResponseLanguage
from app.schemas.jobs import JobRunRead
from app.schemas.repository import RepositoryCreate, RepositoryImportJobResponse
from app.services.indexing_service import IndexingService
from app.services.repository_service import RepositoryService, RepositoryValidationError

logger = logging.getLogger(__name__)


class JobService:
    _executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="code-agent-jobs")

    def __init__(self, db: Session):
        self.db = db
        self.repository_service = RepositoryService(db)

    def enqueue_repository_index_job(
        self,
        repo_id: int,
        response_language: ResponseLanguage | None = None,
    ) -> JobRunRead:
        repository = self.repository_service.get_repository(repo_id, response_language)
        job = JobRun(
            repo_id=repository.id,
            job_type="repository_index",
            status="queued",
            message=self._localized_message(
                response_language,
                "索引任务已进入队列。",
                "Index job queued.",
            ),
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        self._submit_job(job.id, response_language)
        return JobRunRead.model_validate(job)

    def enqueue_repository_clone_job(
        self,
        payload: RepositoryCreate,
        response_language: ResponseLanguage | None = None,
    ) -> RepositoryImportJobResponse:
        repository = self.repository_service.create_pending_github_repository(payload, response_language)
        job = JobRun(
            repo_id=repository.id,
            job_type="repository_clone",
            status="queued",
            message=self._localized_message(
                response_language,
                "GitHub 鍏嬮殕浠诲姟宸茶繘鍏ラ槦鍒椼€?",
                "GitHub clone job queued.",
            ),
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        self._submit_clone_job(job.id, response_language)
        return RepositoryImportJobResponse(
            repository=repository,
            job=JobRunRead.model_validate(job),
        )

    def get_job(self, job_id: int) -> JobRunRead:
        job = self.db.get(JobRun, job_id)
        if job is None:
            raise LookupError(f"Job {job_id} was not found.")
        return JobRunRead.model_validate(job)

    def _submit_job(self, job_id: int, response_language: ResponseLanguage | None) -> None:
        self._executor.submit(self._run_repository_index_job, job_id, response_language)

    def _submit_clone_job(self, job_id: int, response_language: ResponseLanguage | None) -> None:
        self._executor.submit(self._run_repository_clone_job, job_id, response_language)

    def _run_repository_index_job(
        self,
        job_id: int,
        response_language: ResponseLanguage | None,
    ) -> None:
        session = get_session_factory()()
        try:
            job = session.get(JobRun, job_id)
            if job is None:
                logger.warning("jobs.missing job_id=%s", job_id)
                return

            repository_service = RepositoryService(session)
            indexing_service = IndexingService(session)

            job.status = "running"
            job.started_at = utc_now()
            job.message = self._localized_message(
                response_language,
                "索引任务正在执行。",
                "Index job is running.",
            )
            session.add(job)
            session.commit()
            session.refresh(job)

            repository = repository_service.get_repository(job.repo_id, response_language)
            result = indexing_service.request_index(repository, response_language)

            job.status = "succeeded"
            job.message = result.message
            job.file_count = result.file_count
            job.chunk_count = result.chunk_count
            job.skipped_file_count = result.skipped_file_count
            job.finished_at = utc_now()
            session.add(job)
            session.commit()
        except Exception as exc:
            session.rollback()
            job = session.get(JobRun, job_id)
            if job is not None:
                job.status = "failed"
                job.message = str(exc)
                job.finished_at = utc_now()
                session.add(job)
                session.commit()
            logger.exception("jobs.repository_index.failed job_id=%s", job_id)
        finally:
            session.close()

    def _run_repository_clone_job(
        self,
        job_id: int,
        response_language: ResponseLanguage | None,
    ) -> None:
        session = get_session_factory()()
        clone_target = None
        try:
            job = session.get(JobRun, job_id)
            if job is None:
                logger.warning("jobs.missing job_id=%s", job_id)
                return

            repository_service = RepositoryService(session)

            job.status = "running"
            job.started_at = utc_now()
            job.message = self._localized_message(
                response_language,
                "GitHub 鍏嬮殕浠诲姟姝ｅ湪鎵ц銆?",
                "GitHub clone job is running.",
            )
            session.add(job)
            session.commit()
            session.refresh(job)

            repository = repository_service.get_repository(job.repo_id, response_language)
            if repository.source_type != "github" or not repository.source_url:
                raise RepositoryValidationError(
                    self._localized_message(
                        response_language,
                        "鍙湁 GitHub 浠撳簱鍙互鎵ц鍏嬮殕浠诲姟銆?",
                        "Only GitHub repositories can run clone jobs.",
                    )
                )

            clone_target = repository_service._build_clone_target_dir(repository.id, repository.name)
            logger.info(
                "jobs.repository_clone.start job_id=%s repo_id=%s source_url=%s target_dir=%s",
                job.id,
                repository.id,
                repository.source_url,
                clone_target,
            )
            resolved_branch = repository_service._clone_github_repository(
                source_url=repository.source_url,
                target_dir=clone_target,
                default_branch=repository.default_branch,
                response_language=response_language,
            )

            repository.root_path = str(clone_target.resolve())
            repository.default_branch = resolved_branch or repository.default_branch
            repository.status = "pending"
            session.add(repository)

            job.status = "succeeded"
            job.message = self._localized_message(
                response_language,
                "GitHub 鍏嬮殕瀹屾垚锛屽彲浠ュ紑濮嬬储寮曚簡銆?",
                "GitHub clone completed. The repository is ready for indexing.",
            )
            job.finished_at = utc_now()
            session.add(job)
            session.commit()
        except Exception as exc:
            session.rollback()
            if clone_target is not None:
                shutil.rmtree(clone_target, ignore_errors=True)

            job = session.get(JobRun, job_id)
            if job is not None:
                repository = session.get(Repository, job.repo_id)
                if repository is not None:
                    repository.status = "failed"
                    session.add(repository)
                job.status = "failed"
                job.message = str(exc)
                job.finished_at = utc_now()
                session.add(job)
                session.commit()
            logger.exception("jobs.repository_clone.failed job_id=%s", job_id)
        finally:
            session.close()

    def _localized_message(
        self,
        response_language: ResponseLanguage | None,
        zh_cn_message: str,
        en_message: str,
    ) -> str:
        if response_language == ResponseLanguage.ZH_CN:
            return zh_cn_message
        return en_message

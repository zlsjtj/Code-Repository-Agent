import type { JobRun, RepositoryRecord } from "@/lib/types";
import { getWorkspaceCopy, type WorkspaceLocale } from "@/lib/workspace-i18n";

type JobActivityPanelProps = {
  jobs: JobRun[];
  repositories: RepositoryRecord[];
  locale: WorkspaceLocale;
  retryingJobId: number | null;
  onRetry: (jobId: number) => Promise<void> | void;
};

function formatJobStatus(locale: WorkspaceLocale, status: JobRun["status"]): string {
  if (locale === "zh-CN") {
    if (status === "queued") return "排队中";
    if (status === "running") return "运行中";
    if (status === "succeeded") return "已完成";
    return "失败";
  }
  if (status === "queued") return "Queued";
  if (status === "running") return "Running";
  if (status === "succeeded") return "Succeeded";
  return "Failed";
}

function formatJobType(locale: WorkspaceLocale, jobType: JobRun["job_type"]): string {
  if (locale === "zh-CN") {
    return jobType === "repository_clone" ? "仓库克隆" : "仓库索引";
  }
  return jobType === "repository_clone" ? "Repository clone" : "Repository index";
}

export function JobActivityPanel({
  jobs,
  repositories,
  locale,
  retryingJobId,
  onRetry,
}: JobActivityPanelProps) {
  const copy = getWorkspaceCopy(locale);

  return (
    <section className="panel-card">
      <h2 className="panel-title">{copy.jobs.title}</h2>
      <p className="panel-copy">{copy.jobs.description}</p>
      {jobs.length === 0 ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">{copy.jobs.empty}</div>
        </div>
      ) : (
        <div className="job-list">
          {jobs.map((job) => {
            const repository = repositories.find((item) => item.id === job.repo_id);
            return (
              <article className="job-item" key={job.id}>
                <div className="repo-header">
                  <div>
                    <div className="repo-title">{formatJobType(locale, job.job_type)}</div>
                    <div className="repo-meta">
                      {repository?.name ?? `${copy.jobs.repositoryPrefix} #${job.repo_id}`}
                    </div>
                  </div>
                  <span className="status-pill">{formatJobStatus(locale, job.status)}</span>
                </div>
                <div className="repo-meta">{job.message ?? copy.jobs.noMessage}</div>
                {job.status === "failed" ? (
                  <div className="button-row top-gap">
                    <button
                      className="button-secondary"
                      disabled={retryingJobId === job.id}
                      onClick={() => onRetry(job.id)}
                      type="button"
                    >
                      {retryingJobId === job.id ? copy.jobs.retrying : copy.jobs.retry}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

import type { RepositoryRecord } from "@/lib/types";

type RepositoryListProps = {
  repositories: RepositoryRecord[];
  isLoading: boolean;
  indexingRepoId: number | null;
  selectedRepoId: number | null;
  onIndex: (repoId: number) => Promise<void> | void;
  onSelect: (repoId: number) => void;
};

export function RepositoryList({
  repositories,
  isLoading,
  indexingRepoId,
  selectedRepoId,
  onIndex,
  onSelect,
}: RepositoryListProps) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">已登记仓库</h2>
      <p className="panel-copy">
        这里展示已经写入 SQLite 的仓库记录。你可以把其中一个仓库设为当前上下文，再决定是否触发本地索引。
      </p>
      {repositories.length === 0 ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">
            {isLoading ? "正在读取后端仓库记录..." : "还没有仓库记录，先登记一个本地路径或 GitHub 链接。"}
          </div>
        </div>
      ) : (
        <div className="repo-list">
          {repositories.map((repository) => (
            <article
              className={`repo-item ${repository.id === selectedRepoId ? "is-selected" : ""}`}
              key={repository.id}
            >
              <div className="repo-header">
                <div>
                  <div className="repo-title">{repository.name}</div>
                  <div className="repo-meta">
                    {repository.source_type === "local"
                      ? repository.root_path
                      : repository.source_url}
                  </div>
                </div>
                <span className="status-pill">{repository.status}</span>
              </div>
              <div className="repo-meta">
                source_type={repository.source_type}
                {repository.default_branch ? ` | default_branch=${repository.default_branch}` : ""}
              </div>
              <div className="meta-pill-row">
                <span className="meta-pill">{repository.primary_language ?? "language unknown"}</span>
                <span className="meta-pill">
                  {repository.source_type === "local" ? "可建立本地索引" : "当前仅登记元信息"}
                </span>
              </div>
              <div className="button-row">
                <button
                  className="button-secondary"
                  onClick={() => onSelect(repository.id)}
                  type="button"
                >
                  {repository.id === selectedRepoId ? "当前仓库" : "设为当前仓库"}
                </button>
                <button
                  className="button-secondary"
                  disabled={repository.source_type !== "local" || indexingRepoId === repository.id}
                  onClick={() => onIndex(repository.id)}
                  type="button"
                >
                  {repository.source_type !== "local"
                    ? "仅本地索引"
                    : indexingRepoId === repository.id
                      ? "索引中..."
                      : "触发索引"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

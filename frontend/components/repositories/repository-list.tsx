import type { RepositoryRecord } from "@/lib/types";

type RepositoryListProps = {
  repositories: RepositoryRecord[];
  isLoading: boolean;
};

export function RepositoryList({
  repositories,
  isLoading,
}: RepositoryListProps) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">已登记仓库</h2>
      <p className="panel-copy">
        这里展示已经写入 SQLite 的仓库记录。下一阶段会在此基础上补文件树、索引状态和扫描结果。
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
            <article className="repo-item" key={repository.id}>
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
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

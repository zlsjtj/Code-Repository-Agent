"use client";

import type {
  CheckProfile,
  CheckRecommendationResponse,
  CheckRunResponse,
  PatchApplyResponse,
  RepositoryRecord,
} from "@/lib/types";

type ChecksPanelProps = {
  selectedRepository: RepositoryRecord | null;
  profiles: CheckProfile[];
  isLoadingProfiles: boolean;
  isLoadingRecommendation: boolean;
  isRunningChecks: boolean;
  recommendation: CheckRecommendationResponse | null;
  response: CheckRunResponse | null;
  patchApplyResponse: PatchApplyResponse | null;
  onRunChecks: (profileIds?: string[]) => Promise<void> | void;
};

export function ChecksPanel({
  selectedRepository,
  profiles,
  isLoadingProfiles,
  isLoadingRecommendation,
  isRunningChecks,
  recommendation,
  response,
  patchApplyResponse,
  onRunChecks,
}: ChecksPanelProps) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">Lint / Test 闭环</h2>
      <p className="panel-copy">
        这一版只运行自动发现的白名单检查，例如 `python -m pytest` 或 `npm run typecheck/lint/test`。不会执行用户自定义命令。
      </p>

      {!selectedRepository ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">先选择一个仓库，再查看可运行的检查项。</div>
        </div>
      ) : isLoadingProfiles ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">正在扫描可运行的检查项...</div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">
            当前仓库还没有发现安全白名单内的检查项。后端目前只识别 `pytest` 和 `npm` 的常见脚本。
          </div>
        </div>
      ) : (
        <div className="patch-stack">
          {patchApplyResponse?.status === "applied" ? (
            <div className="success-banner">
              最近已经把 patch 写入工作区。现在可以运行默认检查，确认修改没有破坏现有行为。
            </div>
          ) : null}

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">可运行检查</div>
              <div className="summary-value">{profiles.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">当前仓库</div>
              <div className="summary-value">{selectedRepository.name}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">最近结果</div>
              <div className="summary-value">{response?.status ?? "尚未运行"}</div>
            </div>
          </div>

          <div className="check-profile-list">
            {profiles.map((profile) => (
              <article className="check-profile-card" key={profile.id}>
                <div className="answer-header">
                  <div className="answer-label">{profile.name}</div>
                  <div className="meta-pill-row">
                    <span className="meta-pill">{profile.category}</span>
                    <span className="meta-pill">{profile.working_dir}</span>
                  </div>
                </div>
                <div className="citation-meta">{profile.command_preview}</div>
              </article>
            ))}
          </div>

          {isLoadingRecommendation ? (
            <div className="placeholder-card">
              <div className="placeholder-copy">正在根据当前 patch 目标推荐更合适的检查组合...</div>
            </div>
          ) : recommendation ? (
            <div className="recommendation-card">
              <div className="answer-header">
                <div className="answer-label">推荐检查</div>
                <div className="meta-pill-row">
                  <span className="meta-pill">{recommendation.strategy}</span>
                  <span className="meta-pill">{recommendation.items.length} 项</span>
                </div>
              </div>
              <div className="patch-copy">{recommendation.summary}</div>
              <div className="check-profile-list top-gap">
                {recommendation.items.map((item) => (
                  <article className="check-profile-card" key={item.id}>
                    <div className="answer-header">
                      <div className="answer-label">{item.name}</div>
                      <div className="meta-pill-row">
                        <span className="meta-pill">{item.category}</span>
                        <span className="meta-pill">score {item.score}</span>
                      </div>
                    </div>
                    <div className="citation-meta">{item.reason}</div>
                  </article>
                ))}
              </div>
              <div className="button-row patch-action-row top-gap">
                <button
                  className="button-secondary"
                  disabled={isRunningChecks || recommendation.items.length === 0}
                  onClick={() => onRunChecks(recommendation.items.map((item) => item.id))}
                  type="button"
                >
                  {isRunningChecks ? "运行中..." : "只运行推荐检查"}
                </button>
              </div>
            </div>
          ) : null}

          <div className="button-row patch-action-row">
            <button
              className="button-primary"
              disabled={isRunningChecks}
              onClick={() => onRunChecks()}
              type="button"
            >
              {isRunningChecks ? "运行中..." : "运行默认检查"}
            </button>
            <div className="field-help">
              当前会按发现顺序串行执行所有白名单检查，并返回 stdout / stderr 摘要。
            </div>
          </div>
        </div>
      )}

      {response ? (
        <div className="patch-stack top-gap">
          <div className="answer-card">
            <div className="answer-header">
              <div className="answer-label">检查结果摘要</div>
              <div className="meta-pill-row">
                <span className="meta-pill">{response.status}</span>
                <span className="meta-pill">{response.results.length} 项</span>
              </div>
            </div>
            <div className="patch-copy">{response.summary}</div>
          </div>

          <div className="check-result-list">
            {response.results.map((result) => (
              <article className="diff-card" key={result.id}>
                <div className="answer-header">
                  <div className="answer-label">{result.name}</div>
                  <div className="meta-pill-row">
                    <span className="meta-pill">{result.status}</span>
                    <span className="meta-pill">{result.duration_ms} ms</span>
                    <span className="meta-pill">{result.exit_code ?? "n/a"}</span>
                  </div>
                </div>
                <div className="citation-meta">{result.command_preview}</div>
                {result.stdout ? (
                  <pre className="diff-output diff-output-stdout">{result.stdout}</pre>
                ) : null}
                {result.stderr ? (
                  <pre className="diff-output diff-output-stderr">{result.stderr}</pre>
                ) : null}
                {result.truncated ? (
                  <div className="field-help">输出过长，当前仅展示截断后的摘要。</div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

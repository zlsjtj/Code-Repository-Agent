import type { ChatAskResponse } from "@/lib/types";

type CitationPanelProps = {
  response: ChatAskResponse | null;
};

export function CitationPanel({ response }: CitationPanelProps) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">引用与 Trace</h2>
      <p className="panel-copy">
        这里展示回答依赖的引用片段，以及本次问答中 Agent 调用了哪些工具。
      </p>

      {!response ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">
            发起一次问答后，这里会显示文件路径、行号、简短摘录和工具调用摘要。
          </div>
        </div>
      ) : (
        <div className="citation-stack">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">证据片段</div>
              <div className="summary-value">{response.citations.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">工具步骤</div>
              <div className="summary-value">{response.trace_summary.tool_call_count}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">响应耗时</div>
              <div className="summary-value">{response.trace_summary.latency_ms} ms</div>
            </div>
          </div>

          <div className="trace-card">
            <div className="trace-meta">
              <span>{response.trace_summary.agent_name}</span>
              <span>{response.trace_summary.model}</span>
              <span>{response.trace_summary.latency_ms} ms</span>
            </div>
            <div className="trace-meta">
              共调用 {response.trace_summary.tool_call_count} 个工具步骤
            </div>
            <div className="trace-step-list">
              {response.trace_summary.steps.map((step, index) => (
                <div className="trace-step" key={`${step.tool_name}-${index}`}>
                  <div className="trace-step-title">
                    {step.tool_name} · {step.item_count} items
                  </div>
                  <div className="trace-step-copy">{step.args_summary}</div>
                </div>
              ))}
            </div>
          </div>

          {response.citations.length === 0 ? (
            <div className="placeholder-card">
              <div className="placeholder-copy">这次回答没有返回引用，说明 Agent 明确承认了证据不足。</div>
            </div>
          ) : (
            <div className="citation-list">
              {response.citations.map((citation, index) => (
                <article className="citation-card" key={`${citation.path}-${index}`}>
                  <div className="citation-card-header">
                    <div className="citation-index">#{index + 1}</div>
                    <div className="citation-path">
                      {citation.path}
                      {citation.start_line ? `:${citation.start_line}` : ""}
                      {citation.end_line && citation.end_line !== citation.start_line
                        ? `-${citation.end_line}`
                        : ""}
                    </div>
                  </div>
                  <div className="citation-note">{citation.note}</div>
                  {citation.symbol ? (
                    <div className="citation-meta">symbol={citation.symbol}</div>
                  ) : null}
                  {citation.excerpt ? <pre className="citation-excerpt">{citation.excerpt}</pre> : null}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

import type { ChatAskResponse } from "@/lib/types";
import { getWorkspaceCopy, type WorkspaceLocale } from "@/lib/workspace-i18n";

type CitationPanelProps = {
  locale: WorkspaceLocale;
  response: ChatAskResponse | null;
};

export function CitationPanel({ locale, response }: CitationPanelProps) {
  const copy = getWorkspaceCopy(locale);
  const toolCallsLabel = copy.citations.toolCalls.replace(
    "{count}",
    String(response?.trace_summary.tool_call_count ?? 0),
  );
  const groupedCitations = response
    ? Array.from(
        response.citations.reduce<Map<string, typeof response.citations>>((groups, citation) => {
          const current = groups.get(citation.path) ?? [];
          current.push(citation);
          groups.set(citation.path, current);
          return groups;
        }, new Map()),
      )
    : [];
  const traceLabel = locale === "zh-CN" ? "工具调用摘要" : "Tool trace summary";
  const evidenceLabel = locale === "zh-CN" ? "证据片段" : "Evidence snippets";

  return (
    <section className="panel-card">
      <h2 className="panel-title">{copy.citations.title}</h2>
      <p className="panel-copy">{copy.citations.description}</p>

      {!response ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">{copy.citations.empty}</div>
        </div>
      ) : (
        <div className="citation-stack">
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">{copy.citations.evidenceCount}</div>
              <div className="summary-value">{response.citations.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">{copy.citations.toolSteps}</div>
              <div className="summary-value">{response.trace_summary.tool_call_count}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">{copy.citations.latency}</div>
              <div className="summary-value">{response.trace_summary.latency_ms} ms</div>
            </div>
          </div>

          <details className="trace-card trace-card-collapsible">
            <summary className="trace-summary-row">
              <div>
                <div className="answer-label">{copy.citations.traceSummary}</div>
                <div className="trace-meta">{toolCallsLabel}</div>
              </div>
              <div className="meta-pill-row">
                <span className="meta-pill">{response.trace_summary.agent_name}</span>
                <span className="meta-pill">{response.trace_summary.model}</span>
                <span className="meta-pill">{response.trace_summary.latency_ms} ms</span>
              </div>
            </summary>
            <div className="trace-section-label">{traceLabel}</div>
            <div className="trace-step-list">
              {response.trace_summary.steps.map((step, index) => (
                <div className="trace-step" key={`${step.tool_name}-${index}`}>
                  <div className="trace-step-title">
                    {step.tool_name} · {step.item_count}
                  </div>
                  <div className="trace-step-copy">{step.args_summary}</div>
                  {step.summary ? <div className="trace-step-copy">{step.summary}</div> : null}
                </div>
              ))}
            </div>
          </details>

          {response.citations.length === 0 ? (
            <div className="placeholder-card">
              <div className="placeholder-copy">{copy.citations.noCitations}</div>
            </div>
          ) : (
            <details className="trace-card trace-card-collapsible" open>
              <summary className="trace-summary-row">
                <div>
                  <div className="answer-label">{evidenceLabel}</div>
                  <div className="trace-meta">{response.citations.length}</div>
                </div>
              </summary>
              <div className="citation-list">
                {groupedCitations.map(([path, items]) => (
                  <article className="citation-file-card" key={path}>
                    <div className="citation-card-header">
                      <div className="citation-path">{path}</div>
                      <span className="meta-pill">{items.length}</span>
                    </div>
                    <div className="citation-file-list">
                      {items.map((citation, index) => (
                        <article className="citation-card" key={`${path}-${index}`}>
                          <div className="citation-card-header">
                            <div className="citation-index">#{index + 1}</div>
                            <div className="citation-path">
                              {citation.start_line ? `L${citation.start_line}` : path}
                              {citation.end_line && citation.end_line !== citation.start_line
                                ? `-${citation.end_line}`
                                : ""}
                            </div>
                          </div>
                          <div className="citation-note">{citation.note}</div>
                          {citation.symbol ? (
                            <div className="citation-meta">
                              {copy.citations.symbolPrefix}: {citation.symbol}
                            </div>
                          ) : null}
                          {citation.excerpt ? <pre className="citation-excerpt">{citation.excerpt}</pre> : null}
                        </article>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

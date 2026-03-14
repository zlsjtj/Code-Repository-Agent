"use client";

import type { WorkspaceChatEntry } from "@/lib/types";

type ChatHistoryPanelProps = {
  entries: WorkspaceChatEntry[];
  activeSessionId: string | null;
  onSelectSession: (entry: WorkspaceChatEntry) => void;
};

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  month: "numeric",
});

export function ChatHistoryPanel({
  entries,
  activeSessionId,
  onSelectSession,
}: ChatHistoryPanelProps) {
  return (
    <section className="panel-card">
      <h2 className="panel-title">最近会话</h2>
      <p className="panel-copy">
        这里保留当前页面内的问答历史，方便我们在不同回答之间快速来回切换和比对。
      </p>

      {entries.length === 0 ? (
        <div className="placeholder-card">
          <div className="placeholder-copy">
            还没有问答记录。完成一次提问后，这里会显示问题摘要、仓库名和证据数量。
          </div>
        </div>
      ) : (
        <div className="session-list">
          {entries.map((entry) => (
            <button
              className={`session-item ${entry.session_id === activeSessionId ? "is-active" : ""}`}
              key={entry.session_id}
              onClick={() => onSelectSession(entry)}
              type="button"
            >
              <div className="session-question">{entry.question}</div>
              <div className="session-meta">
                {entry.repository_name}
                {entry.repository_language ? ` · ${entry.repository_language}` : ""}
              </div>
              <div className="session-meta">
                {timeFormatter.format(new Date(entry.asked_at))} · {entry.response.citations.length} 条引用
                · {entry.response.trace_summary.tool_call_count} 个工具
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

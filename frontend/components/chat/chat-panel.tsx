export function ChatPanel() {
  return (
    <section className="panel-card">
      <h2 className="panel-title">问答主链路预留</h2>
      <p className="panel-copy">
        第一阶段不接复杂 Agent 逻辑，但前端已经把问答区位置留好。第二阶段开始，这里会逐步接入检索、文件阅读、符号定位和引用展示。
      </p>
      <div className="placeholder-list">
        <div className="placeholder-card">
          <h3 className="placeholder-title">Planned tools</h3>
          <div className="placeholder-copy inline-code">list_repo_tree / search_repo / read_file / find_symbol</div>
        </div>
        <div className="placeholder-card">
          <h3 className="placeholder-title">Answer contract</h3>
          <div className="placeholder-copy">后续回答会尽量包含结论、证据引用、风险提示和下一步建议。</div>
        </div>
      </div>
    </section>
  );
}


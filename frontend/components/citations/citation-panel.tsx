export function CitationPanel() {
  return (
    <section className="panel-card">
      <h2 className="panel-title">引用面板预留</h2>
      <p className="panel-copy">
        后续的代码问答结果会展示文件路径、行号和片段内容。第一阶段先把引用面板的位置和样式预留出来，避免后面再返工结构。
      </p>
      <div className="placeholder-card">
        <div className="placeholder-copy">
          示例形态：
          <span className="inline-code"> backend/app/api/routes/repositories.py:12-32</span>
        </div>
      </div>
    </section>
  );
}


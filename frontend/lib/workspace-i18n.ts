import type {
  CheckCategory,
  CheckStatus,
  RepositorySourceType,
  RepositoryStatus,
} from "@/lib/types";

export type WorkspaceLocale = "zh-CN" | "en";

type LocaleCopy = {
  workspace: {
    eyebrow: string;
    title: string;
    subtitle: string;
    backend: string;
    readyRepos: string;
    recentSessions: string;
    currentRepository: string;
    noRepositorySelected: string;
    selectRepositoryHint: string;
    language: string;
    source: string;
    unknown: string;
    notSelected: string;
    activeStage: string;
    tabs: {
      chat: { label: string; hint: string };
      patch: { label: string; hint: string };
      checks: { label: string; hint: string };
    };
    localeLabel: string;
  };
  repositoryImport: {
    title: string;
    description: string;
    name: string;
    namePlaceholder: string;
    sourceType: string;
    localOption: string;
    githubOption: string;
    localPath: string;
    localPathPlaceholder: string;
    githubUrl: string;
    githubUrlPlaceholder: string;
    defaultBranch: string;
    defaultBranchPlaceholder: string;
    help: string;
    submit: string;
    submitting: string;
    reset: string;
  };
  repositoryList: {
    title: string;
    description: string;
    emptyLoading: string;
    emptyIdle: string;
    sourceTypePrefix: string;
    defaultBranchPrefix: string;
    canIndex: string;
    waitingWorkspace: string;
    currentRepository: string;
    selectRepository: string;
    missingWorkspace: string;
    cloning: string;
    indexing: string;
    triggerIndex: string;
  };
  jobs: {
    title: string;
    description: string;
    empty: string;
    repositoryPrefix: string;
    noMessage: string;
    retry: string;
    retrying: string;
    retryQueued: string;
  };
  chatHistory: {
    title: string;
    description: string;
    empty: string;
    citationCount: string;
    toolCount: string;
  };
  chat: {
    title: string;
    description: string;
    empty: string;
    currentRepository: string;
    repositoryPlaceholder: string;
    repositoryLabel: string;
    questionLabel: string;
    submit: string;
    submitting: string;
    answerTitle: string;
    session: string;
    citationCount: string;
    toolCount: string;
    historyCount: string;
    defaultQuestion: string;
    presetQuestions: string[];
  };
  citations: {
    title: string;
    description: string;
    empty: string;
    evidenceCount: string;
    toolSteps: string;
    latency: string;
    traceSummary: string;
    toolCalls: string;
    noCitations: string;
    symbolPrefix: string;
  };
  patch: {
    title: string;
    description: string;
    selectRepository: string;
    missingWorkspace: string;
    targetRepository: string;
    targetPaths: string;
    targetPathsPlaceholder: string;
    targetPathsHelp: string;
    addSuggestedPath: string;
    instruction: string;
    defaultInstruction: string;
    generateSingle: string;
    generateBatch: (count: number) => string;
    generating: string;
    targetFile: string;
    lineDelta: string;
    latency: string;
    summary: string;
    diffPreview: string;
    confirmApply: string;
    applying: string;
    alreadyApplied: string;
    applyAndVerify: (count: number) => string;
    applyAndVerifyDefault: string;
    applyingAndVerifying: string;
    applyHelp: string;
    noDiff: string;
    batchSummary: string;
    batchModeTitle: string;
    batchModeCopyWithRecommended: (count: number) => string;
    batchModeCopyDefault: string;
    selectedCount: string;
    changedFiles: string;
    applySelected: (count: number) => string;
    applyingBatch: string;
    applySelectedAndVerify: (count: number) => string;
    applySelectedAndVerifyDefault: string;
    applyingBatchAndVerifying: string;
    batchHelp: string;
    combinedDiff: string;
    batchApplyResult: string;
    appliedCount: string;
    noopCount: string;
    selectForBatch: string;
    noApplicableDiff: string;
    singleFileSafeApply: string;
    multiFilePreview: string;
    fileCount: string;
    totalLatency: string;
    changeSummary: string;
    writeSuccess: (path: string, lines: number) => string;
    noTextualDiff: string;
  };
  checks: {
    title: string;
    description: string;
    selectRepository: string;
    loadingProfiles: string;
    emptyProfiles: string;
    patchApplied: string;
    availableChecks: string;
    currentRepository: string;
    latestResult: string;
    notRun: string;
    loadingRecommendation: string;
    recommendationTitle: string;
    recommendationCount: string;
    runRecommended: string;
    runDefault: string;
    running: string;
    runHelp: string;
    summaryTitle: string;
    resultCount: string;
    truncated: string;
  };
  feedback: {
    loadWorkspace: string;
    registerRepository: string;
    indexRepository: string;
    repositoryRegistered: (name: string) => string;
    indexCompleted: (fileCount: number, chunkCount: number) => string;
    askRepository: string;
    answerReady: string;
    switchHistory: (name: string) => string;
    loadChecks: string;
    loadRecommendedChecks: string;
    draftPatch: string;
    draftPatchSingleReady: (path: string) => string;
    draftPatchBatchReady: (count: number) => string;
    applyPatch: string;
    applyPatchDone: (path: string) => string;
    applyPatchBatch: string;
    applyPatchBatchDone: (applied: number, noop: number) => string;
    applyPatchAndVerify: string;
    applyPatchAndVerifyDone: string;
    applyPatchBatchAndVerify: string;
    applyPatchBatchAndVerifyDone: string;
    runChecks: string;
    runChecksDone: (total: number) => string;
  };
};

const zhCN: LocaleCopy = {
  workspace: {
    eyebrow: "代码库工作台",
    title: "代码库问答与改动助手",
    subtitle:
      "在同一个工作台里完成仓库导入、基于证据的问答、改动草案生成和安全检查验证。",
    backend: "后端状态",
    readyRepos: "可用仓库",
    recentSessions: "最近会话",
    currentRepository: "当前仓库",
    noRepositorySelected: "尚未选择仓库",
    selectRepositoryHint: "先从左侧选择一个仓库，或先导入一个新的代码库。",
    language: "语言",
    source: "来源",
    unknown: "未知",
    notSelected: "未选择",
    activeStage: "当前任务",
    tabs: {
      chat: { label: "问答", hint: "围绕当前仓库提问，并查看证据引用。" },
      patch: { label: "改动草案", hint: "先生成差异预览，再决定是否应用。" },
      checks: { label: "检查验证", hint: "运行安全白名单内的检查命令。" },
    },
    localeLabel: "界面语言",
  },
  repositoryImport: {
    title: "导入仓库",
    description: "支持导入本地仓库，也支持把 GitHub 仓库克隆到受管目录后继续使用。",
    name: "仓库名称（可选）",
    namePlaceholder: "例如 code-repo-agent",
    sourceType: "来源类型",
    localOption: "本地仓库",
    githubOption: "GitHub 仓库",
    localPath: "本地仓库路径",
    localPathPlaceholder: "例如 E:\\AI Agent\\demo-repo",
    githubUrl: "GitHub 仓库地址",
    githubUrlPlaceholder: "https://github.com/org/repo",
    defaultBranch: "默认分支",
    defaultBranchPlaceholder: "main",
    help: "本地仓库会直接引用原始路径；GitHub 仓库会先克隆到受管目录，再登记为可用工作区。",
    submit: "登记仓库",
    submitting: "提交中...",
    reset: "重置表单",
  },
  repositoryList: {
    title: "仓库列表",
    description: "这里展示已经写入数据库的仓库记录，并提供索引和切换上下文的入口。",
    emptyLoading: "正在读取后端中的仓库记录...",
    emptyIdle: "还没有仓库记录，先导入一个本地路径或 GitHub 链接。",
    sourceTypePrefix: "来源",
    defaultBranchPrefix: "分支",
    canIndex: "可建立索引",
    waitingWorkspace: "等待工作区",
    currentRepository: "当前仓库",
    selectRepository: "设为当前仓库",
    missingWorkspace: "缺少工作区",
    cloning: "克隆中...",
    indexing: "索引中...",
    triggerIndex: "开始索引",
  },
  jobs: {
    title: "最近任务",
    description: "显示最近的后台克隆和索引任务，便于确认仓库当前正在处理什么。",
    empty: "还没有后台任务记录。",
    repositoryPrefix: "仓库",
    noMessage: "暂无附加说明。",
    retry: "重试",
    retrying: "重试中...",
    retryQueued: "已加入重试队列。",
  },
  chatHistory: {
    title: "最近会话",
    description: "保留当前页面内的问答历史，方便快速回看和切换。",
    empty: "还没有问答记录。完成一次提问后，这里会显示问题摘要、仓库和证据数量。",
    citationCount: "条引用",
    toolCount: "个工具",
  },
  chat: {
    title: "代码问答",
    description: "选择一个已经完成索引的仓库，让 Agent 先检索，再基于证据回答问题。",
    empty: "先导入并索引一个仓库，问答能力才会启用。",
    currentRepository: "当前问答仓库",
    repositoryPlaceholder: "请先选择仓库",
    repositoryLabel: "选择仓库",
    questionLabel: "你的问题",
    submit: "开始问答",
    submitting: "分析中...",
    answerTitle: "Agent 回答",
    session: "会话",
    citationCount: "条引用",
    toolCount: "个工具步骤",
    historyCount: "条历史会话",
    defaultQuestion: "这个仓库现在的索引流程是怎么工作的？关键入口在哪里？",
    presetQuestions: [
      "这个仓库的主入口和核心模块分别在哪里？",
      "索引和问答链路是怎么串起来的？关键接口在哪些文件？",
      "如果现在要排查一个 bug，优先应该看哪些文件？",
    ],
  },
  citations: {
    title: "证据与轨迹",
    description: "这里展示回答所依赖的文件片段，以及本次问答里 Agent 调用了哪些工具。",
    empty: "发起一次问答后，这里会显示文件路径、行号、摘要和工具调用轨迹。",
    evidenceCount: "证据片段",
    toolSteps: "工具步骤",
    latency: "响应耗时",
    traceSummary: "调用轨迹",
    toolCalls: "本次共调用 {count} 个工具步骤",
    noCitations: "这次回答没有返回引用，通常意味着 Agent 明确承认证据不足。",
    symbolPrefix: "符号",
  },
  patch: {
    title: "改动草案",
    description: "支持单文件和多文件草案。系统会先生成差异预览，再决定是否写回工作区。",
    selectRepository: "先选择一个仓库，再生成改动草案。",
    missingWorkspace: "当前仓库还没有可用工作区。先确认它已经导入本地路径，或已经完成克隆。",
    targetRepository: "目标仓库",
    targetPaths: "目标文件路径",
    targetPathsPlaceholder:
      "一行一个路径，例如\nbackend/app/services/chat_service.py\nfrontend/components/checks/checks-panel.tsx",
    targetPathsHelp: "一行一个路径。单文件会走安全应用流程，多文件会先给出分组差异预览。",
    addSuggestedPath: "加入最近引用文件",
    instruction: "改动意图",
    defaultInstruction: "请围绕这些目标文件做最小必要改动，并返回清晰的差异预览。",
    generateSingle: "生成改动草案",
    generateBatch: (count) => `生成多文件改动草案（${count}）`,
    generating: "生成中...",
    targetFile: "目标文件",
    lineDelta: "行数变化",
    latency: "生成耗时",
    summary: "改动摘要",
    diffPreview: "差异预览",
    confirmApply: "确认应用到工作区",
    applying: "应用中...",
    alreadyApplied: "已应用到工作区",
    applyAndVerify: (count) => `应用并运行推荐检查（${count}）`,
    applyAndVerifyDefault: "应用并运行默认检查",
    applyingAndVerifying: "应用并验证中...",
    applyHelp: "应用前会校验文件基线哈希；如果文件已变化，后端会拒绝写入，避免覆盖未预览的新内容。",
    noDiff: "这次草案没有生成文本差异。通常意味着提示不够具体，或者模型判断当前文件无需修改。",
    batchSummary: "批量草案摘要",
    batchModeTitle: "批量预览模式",
    batchModeCopyWithRecommended: (count) =>
      `这批改动已经拿到 ${count} 项推荐检查，可以直接在下方运行。`,
    batchModeCopyDefault: "这批改动已经进入推荐检查流程；如果没有命中更具体的规则，会退回到全部可用检查。",
    selectedCount: "已选文件",
    changedFiles: "变更文件",
    applySelected: (count) => `应用选中文件（${count}）`,
    applyingBatch: "批量应用中...",
    applySelectedAndVerify: (count) => `应用选中文件并运行推荐检查（${count}）`,
    applySelectedAndVerifyDefault: "应用选中文件并运行默认检查",
    applyingBatchAndVerifying: "批量应用并验证中...",
    batchHelp: "选中的文件会作为一次整体提交。后端会先完成整批哈希校验，再统一写入；如果某个文件已变化，整批都会被拒绝。",
    combinedDiff: "合并差异预览",
    batchApplyResult: "批量应用结果",
    appliedCount: "已应用",
    noopCount: "无需改动",
    selectForBatch: "加入批量应用",
    noApplicableDiff: "没有可应用的差异",
    singleFileSafeApply: "单文件安全应用",
    multiFilePreview: "多文件预览",
    fileCount: "文件数量",
    totalLatency: "总耗时",
    changeSummary: "改动说明",
    writeSuccess: (path, lines) => `已写入 ${path}，当前文件共 ${lines} 行。`,
    noTextualDiff: "这个文件没有生成可应用的文本差异。通常意味着提示不够具体，或者当前文件无需修改。",
  },
  checks: {
    title: "代码检查",
    description: "这里只运行自动发现的安全白名单命令，例如 pytest、typecheck、lint 和 test。",
    selectRepository: "先选择一个仓库，再查看可运行的检查项。",
    loadingProfiles: "正在扫描可运行的检查项...",
    emptyProfiles: "当前仓库还没有发现白名单内的检查项。后端目前只识别 pytest 和 npm 常见脚本。",
    patchApplied: "最近已经把改动写入工作区。现在可以运行默认检查，确认修改没有破坏现有行为。",
    availableChecks: "可运行检查",
    currentRepository: "当前仓库",
    latestResult: "最近结果",
    notRun: "尚未运行",
    loadingRecommendation: "正在根据当前改动推荐更合适的检查组合...",
    recommendationTitle: "推荐检查",
    recommendationCount: "项推荐",
    runRecommended: "只运行推荐检查",
    runDefault: "运行默认检查",
    running: "运行中...",
    runHelp: "当前会按发现顺序串行执行所有白名单检查，并返回输出摘要。",
    summaryTitle: "检查结果摘要",
    resultCount: "项结果",
    truncated: "输出过长，当前仅展示截断后的摘要。",
  },
  feedback: {
    loadWorkspace: "无法加载后端工作区。",
    registerRepository: "无法登记仓库。",
    indexRepository: "无法为仓库建立索引。",
    repositoryRegistered: (name) => `已登记仓库：${name}`,
    indexCompleted: (fileCount, chunkCount) => `索引完成：扫描 ${fileCount} 个文件，生成 ${chunkCount} 个片段。`,
    askRepository: "无法发起仓库问答。",
    answerReady: "问答已完成，下面可以查看引用和工具调用摘要。",
    switchHistory: (name) => `已切换到历史会话：${name}`,
    loadChecks: "无法加载可用检查项。",
    loadRecommendedChecks: "无法加载推荐检查项。",
    draftPatch: "无法生成改动草案。",
    draftPatchSingleReady: (path) => `改动草案已生成：${path}`,
    draftPatchBatchReady: (count) => `已生成 ${count} 个文件的改动草案。`,
    applyPatch: "无法应用改动草案。",
    applyPatchDone: (path) => `已把改动写入工作区：${path}`,
    applyPatchBatch: "无法批量应用改动。",
    applyPatchBatchDone: (applied, noop) => `批量应用完成：${applied} 个已写入，${noop} 个无需改动。`,
    applyPatchAndVerify: "无法应用并验证改动。",
    applyPatchAndVerifyDone: "改动已处理，并已完成检查。",
    applyPatchBatchAndVerify: "无法批量应用并验证改动。",
    applyPatchBatchAndVerifyDone: "批量改动已处理，并已完成检查。",
    runChecks: "无法运行仓库检查。",
    runChecksDone: (total) => `检查执行完成，共运行 ${total} 项。`,
  },
};

const en: LocaleCopy = {
  workspace: {
    eyebrow: "Repository workspace",
    title: "Code Repository Agent",
    subtitle:
      "Import a repository, ask grounded questions, draft changes, and run safe verification in one workspace.",
    backend: "Backend",
    readyRepos: "Ready repos",
    recentSessions: "Recent sessions",
    currentRepository: "Current repository",
    noRepositorySelected: "No repository selected",
    selectRepositoryHint: "Select a repository from the left, or import a new codebase first.",
    language: "Language",
    source: "Source",
    unknown: "Unknown",
    notSelected: "Not selected",
    activeStage: "Active stage",
    tabs: {
      chat: { label: "Chat", hint: "Ask grounded questions and inspect evidence." },
      patch: { label: "Patch", hint: "Draft changes first, then review the diff." },
      checks: { label: "Checks", hint: "Run safe allowlisted verification commands." },
    },
    localeLabel: "Interface language",
  },
  repositoryImport: {
    title: "Import repository",
    description:
      "Import a local repository directly, or clone a GitHub repository into the managed workspace.",
    name: "Repository name (optional)",
    namePlaceholder: "For example: code-repo-agent",
    sourceType: "Source type",
    localOption: "Local repository",
    githubOption: "GitHub repository",
    localPath: "Local repository path",
    localPathPlaceholder: "For example: E:\\AI Agent\\demo-repo",
    githubUrl: "GitHub repository URL",
    githubUrlPlaceholder: "https://github.com/org/repo",
    defaultBranch: "Default branch",
    defaultBranchPlaceholder: "main",
    help: "Local repositories reuse the original path. GitHub repositories are cloned into the managed repos directory first.",
    submit: "Register repository",
    submitting: "Submitting...",
    reset: "Reset form",
  },
  repositoryList: {
    title: "Repositories",
    description: "Repositories stored in SQLite, with actions for selecting context and triggering indexing.",
    emptyLoading: "Loading repository records from the backend...",
    emptyIdle: "No repositories yet. Import a local path or a GitHub URL first.",
    sourceTypePrefix: "Source",
    defaultBranchPrefix: "Branch",
    canIndex: "Index ready",
    waitingWorkspace: "Waiting for workspace",
    currentRepository: "Current repository",
    selectRepository: "Use as current repository",
    missingWorkspace: "Missing workspace",
    cloning: "Cloning...",
    indexing: "Indexing...",
    triggerIndex: "Start indexing",
  },
  jobs: {
    title: "Recent jobs",
    description: "Shows recent background clone and index jobs so you can see what the workspace is processing.",
    empty: "No background jobs yet.",
    repositoryPrefix: "Repository",
    noMessage: "No additional message.",
    retry: "Retry",
    retrying: "Retrying...",
    retryQueued: "Retry job queued.",
  },
  chatHistory: {
    title: "Recent sessions",
    description: "A lightweight in-page history so you can compare answers and return to prior sessions.",
    empty: "No chat history yet. After your first question, this list will show the prompt, repository, and evidence counts.",
    citationCount: "citations",
    toolCount: "tools",
  },
  chat: {
    title: "Repository Q&A",
    description: "Choose an indexed repository and let the agent retrieve evidence before answering.",
    empty: "Import and index a repository before using the chat workflow.",
    currentRepository: "Current chat repository",
    repositoryPlaceholder: "Select a repository first",
    repositoryLabel: "Repository",
    questionLabel: "Your question",
    submit: "Ask question",
    submitting: "Thinking...",
    answerTitle: "Agent answer",
    session: "Session",
    citationCount: "citations",
    toolCount: "tool steps",
    historyCount: "history entries",
    defaultQuestion: "How does indexing work in this repository right now, and where is the entry point?",
    presetQuestions: [
      "Where is the main entry point of this repository, and how are the core modules split?",
      "How are indexing and chat connected, and which files hold the key interfaces?",
      "If I needed to debug a bug right now, which files would you inspect first?",
    ],
  },
  citations: {
    title: "Evidence and trace",
    description: "See the supporting file snippets and the tool calls behind the current answer.",
    empty: "After you ask a question, this panel will show file paths, line references, snippets, and tool activity.",
    evidenceCount: "evidence items",
    toolSteps: "tool steps",
    latency: "latency",
    traceSummary: "Execution trace",
    toolCalls: "The agent used {count} tool steps in this answer.",
    noCitations: "This answer returned no citations, which usually means the agent explicitly reported insufficient evidence.",
    symbolPrefix: "Symbol",
  },
  patch: {
    title: "Patch draft",
    description: "Draft changes for one or more files, inspect the diff first, and apply only when you are ready.",
    selectRepository: "Select a repository before drafting a patch.",
    missingWorkspace: "This repository does not have a usable workspace yet. Import a local path or finish cloning first.",
    targetRepository: "Target repository",
    targetPaths: "Target file paths",
    targetPathsPlaceholder:
      "One path per line, for example:\nbackend/app/services/chat_service.py\nfrontend/components/checks/checks-panel.tsx",
    targetPathsHelp:
      "Use one path per line. Single-file drafts keep the safe apply flow. Multi-file drafts start with a grouped diff preview.",
    addSuggestedPath: "Add most recent cited file",
    instruction: "Change request",
    defaultInstruction: "Make the smallest necessary change across these files and return a clear diff preview.",
    generateSingle: "Generate patch draft",
    generateBatch: (count) => `Generate multi-file draft (${count})`,
    generating: "Generating...",
    targetFile: "Target file",
    lineDelta: "Line delta",
    latency: "Latency",
    summary: "Change summary",
    diffPreview: "Diff preview",
    confirmApply: "Apply to workspace",
    applying: "Applying...",
    alreadyApplied: "Already applied",
    applyAndVerify: (count) => `Apply and run recommended checks (${count})`,
    applyAndVerifyDefault: "Apply and run default checks",
    applyingAndVerifying: "Applying and verifying...",
    applyHelp:
      "The backend verifies the file hash before writing. If the file changed after the draft was created, the write is rejected.",
    noDiff:
      "This draft did not produce a textual diff. The instruction may be too vague, or the model may have decided no change was needed.",
    batchSummary: "Batch draft summary",
    batchModeTitle: "Batch preview mode",
    batchModeCopyWithRecommended: (count) =>
      `This batch already has ${count} recommended checks. You can run them directly below.`,
    batchModeCopyDefault:
      "This batch is already in the recommendation flow. If no specific rule matches, the workspace falls back to all discovered checks.",
    selectedCount: "Selected files",
    changedFiles: "Changed files",
    applySelected: (count) => `Apply selected files (${count})`,
    applyingBatch: "Applying batch...",
    applySelectedAndVerify: (count) => `Apply selected files and run recommended checks (${count})`,
    applySelectedAndVerifyDefault: "Apply selected files and run default checks",
    applyingBatchAndVerifying: "Applying batch and verifying...",
    batchHelp:
      "Selected files are treated as one batch. The backend validates all hashes before writing, so any conflict rejects the whole batch.",
    combinedDiff: "Combined diff preview",
    batchApplyResult: "Batch apply result",
    appliedCount: "Applied",
    noopCount: "No-op",
    selectForBatch: "Include in batch apply",
    noApplicableDiff: "No applicable diff",
    singleFileSafeApply: "Single-file safe apply",
    multiFilePreview: "Multi-file preview",
    fileCount: "File count",
    totalLatency: "Total latency",
    changeSummary: "Change notes",
    writeSuccess: (path, lines) => `Wrote ${path} to the workspace. The file now has ${lines} lines.`,
    noTextualDiff:
      "This file did not produce an applicable textual diff. The instruction may be too vague, or no change may be required.",
  },
  checks: {
    title: "Checks",
    description:
      "Only automatically discovered allowlisted commands run here, such as pytest, typecheck, lint, and test.",
    selectRepository: "Select a repository before viewing available checks.",
    loadingProfiles: "Scanning available checks...",
    emptyProfiles:
      "No allowlisted checks were discovered for this repository. The backend currently recognizes pytest and common npm scripts.",
    patchApplied:
      "A patch was recently written to the workspace. Run checks now to confirm the change did not break existing behavior.",
    availableChecks: "Available checks",
    currentRepository: "Current repository",
    latestResult: "Latest result",
    notRun: "Not run yet",
    loadingRecommendation: "Matching the current patch targets to a better check set...",
    recommendationTitle: "Recommended checks",
    recommendationCount: "recommended",
    runRecommended: "Run recommended checks",
    runDefault: "Run default checks",
    running: "Running...",
    runHelp:
      "Checks run serially in discovery order and return summarized stdout and stderr output.",
    summaryTitle: "Check summary",
    resultCount: "results",
    truncated: "Output was truncated because it was too long.",
  },
  feedback: {
    loadWorkspace: "Unable to load the backend workspace.",
    registerRepository: "Unable to register the repository.",
    indexRepository: "Unable to index the repository.",
    repositoryRegistered: (name) => `Registered repository: ${name}`,
    indexCompleted: (fileCount, chunkCount) =>
      `Index completed: scanned ${fileCount} files and produced ${chunkCount} chunks.`,
    askRepository: "Unable to ask the repository question.",
    answerReady: "Answer complete. Review the citations and tool trace below.",
    switchHistory: (name) => `Switched to a previous session for ${name}.`,
    loadChecks: "Unable to load available checks.",
    loadRecommendedChecks: "Unable to load recommended checks.",
    draftPatch: "Unable to draft the patch.",
    draftPatchSingleReady: (path) => `Patch draft ready: ${path}`,
    draftPatchBatchReady: (count) => `Generated patch drafts for ${count} files.`,
    applyPatch: "Unable to apply the patch.",
    applyPatchDone: (path) => `Applied the patch to the workspace: ${path}`,
    applyPatchBatch: "Unable to apply the batch patch.",
    applyPatchBatchDone: (applied, noop) =>
      `Batch apply completed: ${applied} applied, ${noop} unchanged.`,
    applyPatchAndVerify: "Unable to apply and verify the patch.",
    applyPatchAndVerifyDone: "Patch processed and checks completed.",
    applyPatchBatchAndVerify: "Unable to apply and verify the batch patch.",
    applyPatchBatchAndVerifyDone: "Batch patch processed and checks completed.",
    runChecks: "Unable to run repository checks.",
    runChecksDone: (total) => `Finished running ${total} checks.`,
  },
};

const featureLabels: Record<string, Record<WorkspaceLocale, string>> = {
  repository_import: { "zh-CN": "仓库导入", en: "Repository import" },
  github_clone_import: { "zh-CN": "GitHub 克隆导入", en: "GitHub clone import" },
  repository_tree: { "zh-CN": "目录树浏览", en: "Repository tree" },
  basic_chunk_indexing: { "zh-CN": "基础分片索引", en: "Basic chunk indexing" },
  search_repo: { "zh-CN": "代码搜索", en: "Repository search" },
  read_file: { "zh-CN": "文件读取", en: "Read file" },
  find_symbol: { "zh-CN": "符号定位", en: "Find symbol" },
  code_assistant_agent: { "zh-CN": "问答 Agent", en: "Code assistant agent" },
  conversation_trace: { "zh-CN": "调用轨迹", en: "Conversation trace" },
  frontend_workspace: { "zh-CN": "前端工作台", en: "Frontend workspace" },
  patch_draft_preview: { "zh-CN": "草案预览", en: "Patch draft preview" },
  multi_file_patch_draft: { "zh-CN": "多文件草案", en: "Multi-file patch draft" },
  patch_apply: { "zh-CN": "应用草案", en: "Patch apply" },
  multi_file_patch_apply: { "zh-CN": "批量应用", en: "Multi-file patch apply" },
  checks_runner: { "zh-CN": "检查执行", en: "Checks runner" },
  apply_and_verify: { "zh-CN": "应用并验证", en: "Apply and verify" },
  checks_recommendation: { "zh-CN": "检查推荐", en: "Checks recommendation" },
};

const repositoryStatusLabels: Record<RepositoryStatus, Record<WorkspaceLocale, string>> = {
  cloning: { "zh-CN": "克隆中", en: "Cloning" },
  pending: { "zh-CN": "待处理", en: "Pending" },
  ready: { "zh-CN": "可用", en: "Ready" },
  indexing: { "zh-CN": "索引中", en: "Indexing" },
  failed: { "zh-CN": "失败", en: "Failed" },
};

const repositorySourceLabels: Record<RepositorySourceType, Record<WorkspaceLocale, string>> = {
  local: { "zh-CN": "本地", en: "Local" },
  github: { "zh-CN": "GitHub", en: "GitHub" },
};

const checkCategoryLabels: Record<CheckCategory, Record<WorkspaceLocale, string>> = {
  lint: { "zh-CN": "静态检查", en: "Lint" },
  typecheck: { "zh-CN": "类型检查", en: "Typecheck" },
  test: { "zh-CN": "测试", en: "Test" },
};

const checkStatusLabels: Record<CheckStatus, Record<WorkspaceLocale, string>> = {
  passed: { "zh-CN": "通过", en: "Passed" },
  failed: { "zh-CN": "失败", en: "Failed" },
  error: { "zh-CN": "错误", en: "Error" },
  skipped: { "zh-CN": "跳过", en: "Skipped" },
};

const patchStatusLabels: Record<"applied" | "noop" | "rolled_back", Record<WorkspaceLocale, string>> = {
  applied: { "zh-CN": "已应用", en: "Applied" },
  noop: { "zh-CN": "无需改动", en: "No-op" },
  rolled_back: { "zh-CN": "已回滚", en: "Rolled back" },
};

const healthLabels: Record<string, Record<WorkspaceLocale, string>> = {
  ok: { "zh-CN": "正常", en: "Healthy" },
  waiting: { "zh-CN": "等待中", en: "Waiting" },
};

const recommendationStrategyLabels: Record<
  "matched" | "fallback_all" | "none",
  Record<WorkspaceLocale, string>
> = {
  matched: { "zh-CN": "已匹配", en: "Matched" },
  fallback_all: { "zh-CN": "回退到全部", en: "Fallback to all" },
  none: { "zh-CN": "无推荐", en: "None" },
};

const localeCopy: Record<WorkspaceLocale, LocaleCopy> = {
  "zh-CN": zhCN,
  en,
};

export function getWorkspaceCopy(locale: WorkspaceLocale): LocaleCopy {
  return localeCopy[locale];
}

export function formatRepositoryStatus(locale: WorkspaceLocale, status: RepositoryStatus): string {
  return repositoryStatusLabels[status][locale];
}

export function formatRepositorySource(locale: WorkspaceLocale, sourceType: RepositorySourceType): string {
  return repositorySourceLabels[sourceType][locale];
}

export function formatCheckCategory(locale: WorkspaceLocale, category: CheckCategory): string {
  return checkCategoryLabels[category][locale];
}

export function formatCheckStatus(locale: WorkspaceLocale, status: CheckStatus): string {
  return checkStatusLabels[status][locale];
}

export function formatPatchStatus(
  locale: WorkspaceLocale,
  status: "applied" | "noop" | "rolled_back",
): string {
  return patchStatusLabels[status][locale];
}

export function formatHealthStatus(locale: WorkspaceLocale, status: string): string {
  return healthLabels[status]?.[locale] ?? status;
}

export function formatRecommendationStrategy(
  locale: WorkspaceLocale,
  strategy: "matched" | "fallback_all" | "none",
): string {
  return recommendationStrategyLabels[strategy][locale];
}

export function formatFeature(locale: WorkspaceLocale, feature: string): string {
  return featureLabels[feature]?.[locale] ?? feature.replaceAll("_", " ");
}

export const localeOptions: Array<{ value: WorkspaceLocale; label: string }> = [
  { value: "zh-CN", label: "中文" },
  { value: "en", label: "English" },
];

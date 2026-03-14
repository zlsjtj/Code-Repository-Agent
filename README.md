# 代码库问答与改动助手（AI Agent）

面向本地代码仓库与 GitHub 仓库的工程化 AI Agent 项目。当前已经推进到第十三阶段，并把工作台继续扩展到了“支持 GitHub 仓库 clone 导入并进入完整工作流”：

- 第一阶段：项目骨架、FastAPI、Next.js、SQLite schema、健康检查、仓库导入
- 第二阶段：本地仓库扫描、文件树接口、基础 chunk 索引、索引状态与调试查询
- 第三阶段：`list_repo_tree`、`search_repo`、`read_file`、`find_symbol` 工具与统一返回结构
- 第四阶段：OpenAI Agents SDK 问答主流程、`/api/chat/ask`、引用返回与 `ConversationTrace` 落库
- 第五阶段：前端工作台增强，补当前仓库上下文、最近会话切换、引用摘要和更完整的问答展示
- 第六阶段：单文件 patch 草案、unified diff 预览，以及前端 patch 工作区
- 第七阶段：基于内容哈希校验的 patch 应用接口，把已确认的单文件草案安全写回工作区
- 第八阶段：自动发现白名单检查项，支持运行 `pytest` / `npm run typecheck|lint|test` 并把结果返回到前端
- 第九阶段：把 patch 应用与 checks 运行编排成一个一键闭环，减少手动切换和重复操作
- 第十阶段：根据 patch 目标路径自动推荐 checks 组合，让 apply-and-verify 更贴近真实改动范围
- 第十一阶段：支持多文件 patch 草案批量预览，按文件返回 grouped diff，并把推荐 checks 自动扩展到多路径改动
- 第十二阶段：支持多文件 patch 的勾选确认、all-or-nothing 批量写回，以及批量 apply 后运行 checks
- 第十三阶段：支持把 GitHub 仓库 clone 到受管目录，并复用现有索引、问答、patch 和 checks 流程

项目目标不是做一个“会聊天的网页”，而是做一个“能围绕代码任务调用工具、引用证据、逐步扩展到改动建议和检查闭环”的代码助手。

## 当前进度

当前仓库已经支持：

- 登记本地仓库路径
- 保存 GitHub 仓库元信息
- 把 GitHub 仓库 clone 到受管 `repos/` 目录
- 扫描本地仓库文件树
- 过滤常见无关目录、二进制文件和超大文件
- 按行切分文本文件并写入 `FileChunk`
- 查询索引状态
- 查询部分 chunk，便于调试下一阶段检索工具
- 在前端工作台直接触发索引
- 通过统一工具接口执行目录树、关键词检索、按行读文件和符号定位
- 通过 OpenAI Agents SDK 自动调用工具并返回带引用的回答
- 持久化问答 trace，包括工具调用摘要、引用和最终答案
- 在前端页面内保留最近会话，支持切回历史回答继续查看引用
- 生成单文件 patch 草案，并在前端直接预览 unified diff
- 一次为多个目标文件生成 patch 草案预览，并按文件分组查看 diff
- 勾选多文件 patch 草案中的目标项，并做 all-or-nothing 批量写回
- 把确认过的 patch 草案安全写回本地工作区，并避免覆盖已变化的文件
- 自动发现并运行安全白名单内的 lint/test 检查，直接返回 stdout / stderr 摘要
- 一键完成 patch 写回和默认 checks 验证，并把结果汇总回工作台
- 根据改动文件路径自动推荐更相关的 checks 组合，并在前端直接使用推荐结果

当前仍未实现：

- checks 失败后的自动回滚
- 更细粒度地结合 diff 内容、语言和目录结构推荐 checks
- 语义检索、rerank 和 AST 级符号定位增强
- benchmark 样例、系统化评测和 trace 可视化

## 项目目录

```text
.
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ router.py
│  │  │  └─ routes/
│  │  │     ├─ health.py
│  │  │     ├─ chat.py
│  │  │     └─ repositories.py
│  │  ├─ agents/
│  │  │  └─ code_assistant.py
│  │  ├─ core/
│  │  │  ├─ config.py
│  │  │  └─ db.py
│  │  ├─ indexing/
│  │  │  ├─ chunker.py
│  │  │  └─ scanner.py
│  │  ├─ models/
│  │  │  ├─ repository.py
│  │  │  ├─ file_chunk.py
│  │  │  └─ conversation_trace.py
│  │  ├─ schemas/
│  │  │  ├─ common.py
│  │  │  ├─ chat.py
│  │  │  └─ repository.py
│  │  ├─ services/
│  │  │  ├─ chat_service.py
│  │  │  ├─ repository_service.py
│  │  │  └─ indexing_service.py
│  │  ├─ tools/
│  │  └─ main.py
│  ├─ scripts/
│  ├─ tests/
│  ├─ pyproject.toml
│  └─ README.md
├─ frontend/
│  ├─ app/
│  ├─ components/
│  ├─ lib/
│  ├─ public/
│  ├─ next.config.mjs
│  ├─ package.json
│  └─ tsconfig.json
├─ repos/
├─ data/
├─ benchmarks/
├─ docs/
├─ .env.example
└─ README.md
```

## 已实现能力

### 后端

- FastAPI 应用入口与统一路由注册
- 基于 SQLite 的 SQLAlchemy 数据库初始化
- 三张核心表：
  - `Repository`
  - `FileChunk`
  - `ConversationTrace`
- 仓库服务：
  - 本地路径校验
  - GitHub 元信息登记
  - 仓库列表 / 详情查询
- 基础索引服务：
  - 文件树扫描
  - 忽略目录过滤
  - 二进制文件过滤
  - 超大文件过滤
  - 行级 chunk 切分
  - 主语言粗略统计
- 调试型查询接口：
  - 文件树
  - 索引状态
  - chunk 列表
- 问答主流程：
  - Code Assistant Agent
  - 受控工具调用
  - 结构化回答
  - 引用返回
  - trace 持久化

### 前端

- Next.js App Router 基础结构
- 首页工作台
- 后端健康状态探测
- 仓库导入表单
- 已登记仓库列表
- 触发索引按钮
- 当前仓库上下文面板
- 问答区、引用区和 trace 摘要
- 页面内最近会话历史切换
- Patch 草案表单与 diff 预览
- 多文件 patch 草案输入与 grouped diff 预览
- 多文件 patch 结果勾选与批量应用
- Checks 面板与结果摘要
- 一键应用并验证入口
- 推荐 checks 展示与一键使用入口

## 数据模型

### `Repository`

记录导入仓库的元信息。

- `id`
- `name`
- `source_type`
- `source_url`
- `root_path`
- `default_branch`
- `primary_language`
- `status`
- `created_at`
- `updated_at`

### `FileChunk`

保存切分后的代码片段，为后续检索和引用提供基础。

- `id`
- `repo_id`
- `path`
- `language`
- `chunk_index`
- `start_line`
- `end_line`
- `text`
- `hash`
- `symbols_json`
- `created_at`

### `ConversationTrace`

为后续问答 trace、工具调用和引用链路预留。

- `id`
- `session_id`
- `repo_id`
- `user_query`
- `tool_calls_json`
- `citations_json`
- `final_answer`
- `latency_ms`
- `created_at`

## API

### 基础

- `GET /api/health`
- `GET /api/meta`

### 仓库管理

- `POST /api/repositories`
- `GET /api/repositories`
- `GET /api/repositories/{repo_id}`

### 索引与调试

- `GET /api/repositories/{repo_id}/tree`
- `POST /api/repositories/{repo_id}/index`
- `GET /api/repositories/{repo_id}/index-status`
- `GET /api/repositories/{repo_id}/chunks`

### 工具调试接口

- `POST /api/tools/list-tree`
- `POST /api/tools/search`
- `POST /api/tools/read`
- `POST /api/tools/find-symbol`

这些接口共用统一的返回结构：

```json
{
  "tool_name": "search_repo",
  "repo_id": 1,
  "items": [
    {
      "kind": "search_match",
      "path": "src/service.py",
      "start_line": 5,
      "end_line": 10,
      "language": "python",
      "content": "def fetch_user(user_id: int): ...",
      "score": 3.5
    }
  ],
  "truncated": false,
  "total_matches": 1,
  "summary": "Found 1 indexed chunk matches for query 'fetch_user'."
}
```

### 问答接口

- `POST /api/chat/ask`

### Patch 草案接口

- `POST /api/patches/draft`
- `POST /api/patches/draft-batch`
- `POST /api/patches/apply`
- `POST /api/patches/apply-batch`
- `POST /api/patches/apply-and-checks`
- `POST /api/patches/apply-batch-and-checks`

### Checks 接口

- `GET /api/checks/repositories/{repo_id}/profiles`
- `POST /api/checks/recommend`
- `POST /api/checks/run`

请求示例：

```json
{
  "repo_id": 1,
  "target_path": "backend/app/services/chat_service.py",
  "instruction": "在不改变现有接口的前提下，补一个更明确的错误提示。"
}
```

返回结构：

```json
{
  "session_id": "86f7...",
  "repo_id": 1,
  "target_path": "backend/app/services/chat_service.py",
  "base_content_sha256": "9a8c...",
  "summary": "补强配置错误提示。",
  "rationale": "只改动错误消息，避免影响主流程。",
  "warnings": [
    "应用前建议先再看一遍 diff。"
  ],
  "original_line_count": 98,
  "proposed_line_count": 101,
  "line_count_delta": 3,
  "unified_diff": "--- a/backend/app/services/chat_service.py\n+++ b/backend/app/services/chat_service.py\n@@ ...",
  "proposed_content": "...",
  "trace_summary": {
    "agent_name": "PatchDraftAssistant",
    "model": "gpt-4.1-mini",
    "latency_ms": 980
  }
}
```

说明：

- 只要仓库拥有可用 `root_path`，无论是本地路径还是 GitHub clone，都可以继续进入索引、问答、patch 和 checks 流程
- `draft` 只处理单个现有文本文件
- `draft-batch` 支持一次预览多个现有文本文件，默认上限 `5` 个文件
- `draft` 返回的是预览结果，不会自动把文件写回工作区
- `draft-batch` 返回 grouped diff 预览，前端可以在此基础上勾选要落地的文件
- `apply` 会在写入前校验 `base_content_sha256`，只有目标文件仍与草案基线一致时才会真正写入
- `apply-batch` 会先校验整批选中文件的基线哈希，全部通过后才开始写回；任意一个文件冲突都会整批拒绝
- `apply-batch-and-checks` 会在批量写回后运行选中的 checks，但当前不会因为 checks 失败而自动回滚文件
- 文件大小默认限制在 `500` 行、`20,000` 字符以内，优先保证草案稳定性

`POST /api/patches/draft-batch` 请求示例：

```json
{
  "repo_id": 1,
  "target_paths": [
    "backend/app/services/chat_service.py",
    "frontend/components/checks/checks-panel.tsx"
  ],
  "instruction": "围绕这两个文件做最小必要改动，并给我分组 diff 预览。"
}
```

返回结构：

```json
{
  "session_id": "86f7...",
  "repo_id": 1,
  "target_paths": [
    "backend/app/services/chat_service.py",
    "frontend/components/checks/checks-panel.tsx"
  ],
  "summary": "Generated patch drafts for 2 file(s). Review the grouped diffs first, then apply any accepted changes one file at a time.",
  "warnings": [],
  "changed_file_count": 2,
  "total_original_line_count": 180,
  "total_proposed_line_count": 188,
  "total_line_count_delta": 8,
  "combined_unified_diff": "--- a/backend/app/services/chat_service.py\n+++ b/backend/app/services/chat_service.py\n@@ ...",
  "items": [
    {
      "target_path": "backend/app/services/chat_service.py",
      "base_content_sha256": "9a8c...",
      "summary": "补强错误提示。",
      "rationale": "只调整文案，不改动已有接口。",
      "warnings": [],
      "original_line_count": 98,
      "proposed_line_count": 101,
      "line_count_delta": 3,
      "unified_diff": "--- a/backend/app/services/chat_service.py\n+++ b/backend/app/services/chat_service.py\n@@ ...",
      "proposed_content": "...",
      "trace_summary": {
        "agent_name": "PatchDraftAssistant",
        "model": "gpt-4.1-mini",
        "latency_ms": 980
      }
    }
  ],
  "trace_summary": {
    "agent_name": "PatchDraftAssistant",
    "model": "gpt-4.1-mini",
    "latency_ms": 1680
  }
}
```

`POST /api/patches/apply` 请求示例：

```json
{
  "repo_id": 1,
  "target_path": "backend/app/services/chat_service.py",
  "expected_base_sha256": "9a8c...",
  "proposed_content": "..."
}
```

`POST /api/patches/apply-and-checks` 请求示例：

```json
{
  "repo_id": 1,
  "target_path": "backend/app/services/chat_service.py",
  "expected_base_sha256": "9a8c...",
  "proposed_content": "...",
  "profile_ids": ["backend_pytest", "frontend_npm-typecheck"]
}
```

`POST /api/patches/apply-batch` 请求示例：

```json
{
  "repo_id": 1,
  "items": [
    {
      "target_path": "backend/app/services/chat_service.py",
      "expected_base_sha256": "9a8c...",
      "proposed_content": "..."
    },
    {
      "target_path": "frontend/components/checks/checks-panel.tsx",
      "expected_base_sha256": "2f11...",
      "proposed_content": "..."
    }
  ]
}
```

返回结构：

```json
{
  "repo_id": 1,
  "status": "applied",
  "message": "Applied 2 file(s) to the working tree successfully.",
  "applied_count": 2,
  "noop_count": 0,
  "target_paths": [
    "backend/app/services/chat_service.py",
    "frontend/components/checks/checks-panel.tsx"
  ],
  "combined_unified_diff": "--- a/backend/app/services/chat_service.py\n+++ b/backend/app/services/chat_service.py\n@@ ...",
  "results": [
    {
      "repo_id": 1,
      "target_path": "backend/app/services/chat_service.py",
      "status": "applied",
      "message": "The patch draft was written to the working tree successfully.",
      "previous_sha256": "9a8c...",
      "written_sha256": "3ab1...",
      "written_line_count": 101,
      "unified_diff": "--- a/backend/app/services/chat_service.py\n+++ b/backend/app/services/chat_service.py\n@@ ..."
    }
  ]
}
```

返回结构：

```json
{
  "patch": {
    "repo_id": 1,
    "target_path": "backend/app/services/chat_service.py",
    "status": "applied",
    "message": "The patch draft was written to the working tree successfully.",
    "previous_sha256": "9a8c...",
    "written_sha256": "2f11...",
    "written_line_count": 101,
    "unified_diff": "--- a/backend/app/services/chat_service.py\n+++ b/backend/app/services/chat_service.py\n@@ ..."
  },
  "checks": {
    "repo_id": 1,
    "status": "passed",
    "summary": "Completed 2 checks successfully.",
    "results": []
  }
}
```

说明补充：

- `apply-and-checks` 会先校验 patch 基线，再写入工作区，最后运行选中的默认检查
- `apply-batch-and-checks` 会先校验整批 patch 基线，再写入选中的文件，最后运行选中的默认检查
- 如果 `profile_ids` 为空，会运行当前仓库下自动发现的全部白名单检查
- 如果 `profile_ids` 非法，后端会在写入 patch 之前先拒绝请求，避免“文件已改但检查参数无效”的半完成状态

`GET /api/checks/repositories/{repo_id}/profiles` 返回示例：

```json
{
  "repo_id": 1,
  "items": [
    {
      "id": "backend_pytest",
      "name": "Pytest (backend)",
      "category": "test",
      "working_dir": "E:/repo/backend",
      "command_preview": "python -m pytest tests"
    },
    {
      "id": "frontend_npm-typecheck",
      "name": "TypeScript Typecheck (frontend)",
      "category": "typecheck",
      "working_dir": "E:/repo/frontend",
      "command_preview": "npm run typecheck"
    }
  ]
}
```

`POST /api/checks/recommend` 请求示例：

```json
{
  "repo_id": 1,
  "changed_paths": ["frontend/app/page.tsx"]
}
```

返回结构：

```json
{
  "repo_id": 1,
  "changed_paths": ["frontend/app/page.tsx"],
  "strategy": "matched",
  "summary": "Recommended 2 checks based on 1 changed path(s).",
  "items": [
    {
      "id": "frontend_npm-typecheck",
      "name": "TypeScript Typecheck (frontend)",
      "category": "typecheck",
      "working_dir": "E:/repo/frontend",
      "command_preview": "npm run typecheck",
      "reason": "`frontend/app/page.tsx` is inside `frontend/`. Frontend file changes should run npm checks.",
      "score": 10
    }
  ]
}
```

`POST /api/checks/run` 请求示例：

```json
{
  "repo_id": 1,
  "profile_ids": ["backend_pytest", "frontend_npm-typecheck"]
}
```

返回结构：

```json
{
  "repo_id": 1,
  "status": "passed",
  "summary": "Completed 2 checks successfully.",
  "results": [
    {
      "id": "backend_pytest",
      "name": "Pytest (backend)",
      "category": "test",
      "working_dir": "E:/repo/backend",
      "command_preview": "python -m pytest tests",
      "status": "passed",
      "exit_code": 0,
      "duration_ms": 820,
      "stdout": "...",
      "stderr": "",
      "truncated": false
    }
  ]
}
```

说明：

- 当前只运行自动发现的白名单检查，不支持用户自定义任意命令
- Python 侧目前优先识别 `python -m pytest tests`
- Node 侧目前优先识别 `npm run typecheck`、`npm run lint`、`npm run test`
- 推荐逻辑当前主要基于目标文件路径、目录范围和语言后缀，匹配不到时会回退到全部已发现检查
- 输出过长时会截断，优先保证 API 响应稳定

返回结构：

```json
{
  "repo_id": 1,
  "target_path": "backend/app/services/chat_service.py",
  "status": "applied",
  "message": "The patch draft was written to the working tree successfully.",
  "previous_sha256": "9a8c...",
  "written_sha256": "2f11...",
  "written_line_count": 101,
  "unified_diff": "--- a/backend/app/services/chat_service.py\n+++ b/backend/app/services/chat_service.py\n@@ ..."
}
```

请求示例：

```json
{
  "repo_id": 1,
  "question": "这个仓库的索引流程是怎么工作的？"
}
```

返回结构：

```json
{
  "session_id": "b3dbf4...",
  "answer": "## 结论\n...\n\n## 依据\n...",
  "citations": [
    {
      "path": "backend/app/services/indexing_service.py",
      "start_line": 12,
      "end_line": 68,
      "symbol": null,
      "note": "这里是索引入口和 chunk 写入流程。",
      "excerpt": "..."
    }
  ],
  "trace_summary": {
    "agent_name": "CodeAssistant",
    "model": "gpt-4.1-mini",
    "latency_ms": 1450,
    "tool_call_count": 3,
    "steps": [
      {
        "tool_name": "search_repo",
        "args_summary": "query=indexing_service, limit=8",
        "item_count": 2,
        "summary": "Found 2 indexed chunk matches."
      }
    ]
  }
}
```

说明：

- 当前问答能力只支持已经完成索引的本地仓库
- Agent 会被要求至少调用一个工具后再回答
- 如果证据不足，Agent 应明确说明不确定，而不是编造引用

## 索引策略

第二阶段采用最稳妥、最简单的可工作方案：

- 只对本地仓库执行真实扫描
- GitHub 仓库当前只保存元信息，不自动克隆
- 忽略目录包括：`.git`、`node_modules`、`dist`、`build`、`.next`、`coverage`、`venv` 等
- 跳过大于 `512 KB` 的文件
- 跳过二进制文件和非 UTF-8 文本
- 使用“固定行数窗口 + 重叠行数”的方式切分：
  - 每个 chunk 最多 `80` 行
  - 相邻 chunk 保留 `20` 行重叠

这样设计的原因：

- 实现简单，便于验证
- 每个 chunk 天然带行号边界
- 后续接入 embedding、rerank 或 AST 工具时不需要推翻当前结构

## 快速启动

### 1. 准备环境变量

```powershell
Copy-Item .env.example .env
```

至少需要配置：

- `OPENAI_API_KEY`
- 可选：`CODE_AGENT_OPENAI_MODEL`，默认是 `gpt-4.1-mini`

### 2. 启动后端

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
```

访问：

- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: [http://localhost:8000/api/health](http://localhost:8000/api/health)

GitHub 导入补充：

- `POST /api/repositories` 在 `source_type=github` 时会调用本机 `git clone`
- clone 目标目录默认是根目录下的 `repos/`
- 如需调整 clone 超时或深度，可配置：
  - `CODE_AGENT_GIT_CLONE_TIMEOUT_SECONDS`
  - `CODE_AGENT_GIT_CLONE_DEPTH`

### 3. 启动前端

```powershell
cd frontend
npm install
npm run dev
```

访问：

- Frontend: [http://localhost:3000](http://localhost:3000)

## 第二阶段验证

建议按下面顺序验证：

1. 登记一个本地仓库：

```json
{
  "source_type": "local",
  "root_path": "E:\\AI Agent\\1Code Repository Agent"
}
```

2. 调用 `POST /api/repositories/{repo_id}/index`
3. 调用 `GET /api/repositories/{repo_id}/index-status`
4. 调用 `GET /api/repositories/{repo_id}/tree?depth=2`
5. 调用 `GET /api/repositories/{repo_id}/chunks?limit=10`
6. 调用工具调试接口，例如：

```json
POST /api/tools/search
{
  "repo_id": 1,
  "query": "request_index"
}
```

```json
POST /api/tools/read
{
  "repo_id": 1,
  "path": "backend/app/api/routes/repositories.py",
  "start_line": 1,
  "end_line": 40
}
```

```json
POST /api/tools/find-symbol
{
  "repo_id": 1,
  "name": "request_index"
}
```

7. 打开前端首页，点击“触发索引”，确认能看到成功提示
8. 在前端问答区选择一个已完成索引的本地仓库，提问并确认页面展示：
   - 回答正文
   - 引用列表
   - 工具调用摘要

## 测试

后端测试命令：

```powershell
cd backend
python -m pytest
```

当前测试覆盖：

- 健康检查接口
- 仓库创建与列表
- 文件树过滤
- 索引写入与状态查询
- 工具接口：目录树、检索、读文件、找符号
- 问答接口：返回回答、引用，并写入 `ConversationTrace`
- patch 草案接口：返回 unified diff 和完整草案内容
- 多文件 patch 草案接口：返回 grouped diff 和逐文件草案内容
- patch 应用接口：只在基线内容未变化时把草案写回工作区
- 多文件 patch 应用接口：先做整批哈希校验，再批量写回并返回逐文件结果
- checks 接口：发现并运行白名单 lint/test 命令，返回结果摘要
- apply-and-checks 接口：把 patch 写回和检查执行串成一次请求
- checks 推荐接口：按改动路径返回更相关的 checks 组合与原因

## 设计取舍

当前实现刻意保持简单：

- 索引同步执行，不引入任务队列
- 不做 embedding，不引入向量库
- 不做 GitHub 自动克隆
- 不做 AST 级符号解析
- 不做复杂权限和多用户设计

这让第二阶段能尽快形成可验证的索引基础层，后续新增工具时不需要返工核心数据结构。

## 下一阶段

下一阶段建议优先实现：

1. 结合 diff 内容和失败历史，进一步优化 checks 推荐准确度
2. 增加 benchmark 样例与问答评测
3. 引入更稳妥的检索策略，例如 embedding 和 rerank
4. 增加 checks 失败后的回滚建议与修复流
5. 再考虑后台任务队列与更完整的导入审计

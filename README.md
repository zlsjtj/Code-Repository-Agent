# 代码库问答与改动助手

一个面向代码仓库的可扩展 AI Agent 项目。它不只是“对代码聊天”，而是围绕真实工程任务提供一条完整链路：

- 导入本地仓库或 GitHub 仓库
- 建立基础代码索引
- 通过受控工具检索代码、阅读文件、定位符号
- 基于证据回答问题并返回引用
- 生成 patch 草案与 diff 预览
- 在安全约束下执行 lint / test 闭环

项目采用 `FastAPI + Next.js + SQLite + OpenAI Agents SDK`，重点体现的是一个可调用工具、可引用证据、可持续扩展的代码 Agent 系统，而不是单一的聊天界面。

## 项目简介

在日常开发里，团队常见的需求并不是“让模型解释一段代码”，而是：

- 这个模块到底做什么
- 关键入口在哪
- 某个 bug 可能出在哪几层
- 如果要改动，应该先改哪些文件
- 改完之后如何快速验证没有破坏已有行为

这个项目针对的就是这类场景。系统将代码仓库转成可检索的结构化上下文，再通过受控工具链驱动 Agent 完成“检索 -> 阅读 -> 回答 -> 引用 -> 改动建议 -> 验证”的工作流。

如果从作品集角度看，这个项目的价值在于：

- 它把 LLM 能力落到了工程任务，而不是停留在通用对话
- 它强调工具调用、证据引用和风险约束
- 架构上为检索增强、代码修改和自动验证预留了扩展空间

## 核心能力

- 仓库导入：支持导入本地代码仓库，也支持将 GitHub 仓库 clone 到受管目录后继续处理。
- 基础索引：扫描文件树、过滤无关目录和超大文件、按行切分代码片段并写入 SQLite。
- 代码检索工具：支持 `list_repo_tree`、`search_repo`、`read_file`、`find_symbol`。
- Agent 问答：通过 OpenAI Agents SDK 调用工具后回答问题，并返回引用证据与调用摘要。
- 前端工作台：支持仓库选择、会话查看、引用展示、patch 预览和检查结果查看。
- Patch 草案：支持单文件和多文件 patch 草案、unified diff 预览、逐项确认和批量应用。
- 验证闭环：自动发现安全白名单内的 `pytest` / `npm run typecheck|lint|test`，并支持应用 patch 后直接运行检查。
- 风险约束：通过路径约束、哈希校验、白名单命令和分步确认降低误改和误执行风险。

## 系统架构图

```text
+---------------------------+
|       Next.js Frontend    |
|  会话页 / 引用 / Patch UI  |
+------------+--------------+
             |
             | HTTP API
             v
+---------------------------+
|      FastAPI Backend      |
|  Router / Schemas / APIs  |
+------------+--------------+
             |
   +---------+---------+--------------------+
   |                   |                    |
   v                   v                    v
+--------+     +---------------+     +--------------+
| Agent  |     | Tool Runtime  |     | Patch/Checks |
| Runner |     | search/read   |     | diff/apply   |
| OpenAI |     | tree/symbol   |     | lint/test    |
+----+---+     +-------+-------+     +------+-------+
     |                   |                    |
     |                   |                    |
     v                   v                    v
+---------------------------------------------------+
|                Repository Workspace               |
| local path / cloned GitHub repo / scanned files  |
+----------------------+----------------------------+
                       |
                       v
+---------------------------------------------------+
| SQLite                                             |
| Repository / FileChunk / ConversationTrace         |
+---------------------------------------------------+
```

核心链路可以概括为：

1. 导入仓库并建立工作区
2. 扫描文件并生成索引
3. Agent 通过工具检索上下文
4. 回答时返回引用证据
5. 需要改动时生成 patch 草案
6. 确认后应用 patch 并运行 checks

## 目录结构

```text
.
├─ backend/
│  ├─ app/
│  │  ├─ api/              # FastAPI 路由
│  │  ├─ agents/           # Agent 定义与运行上下文
│  │  ├─ core/             # 配置、数据库初始化
│  │  ├─ indexing/         # 文件扫描与 chunk 切分
│  │  ├─ models/           # SQLAlchemy 模型
│  │  ├─ schemas/          # Pydantic 请求/响应模型
│  │  ├─ services/         # 仓库、索引、问答、patch、checks
│  │  ├─ tools/            # 代码检索工具实现
│  │  └─ main.py
│  ├─ tests/
│  └─ pyproject.toml
├─ frontend/
│  ├─ app/                 # Next.js App Router
│  ├─ components/          # 工作台、问答、引用、patch、checks
│  ├─ lib/                 # API client 与类型定义
│  └─ package.json
├─ data/                   # SQLite 数据与运行时文件
├─ repos/                  # GitHub 仓库 clone 目录
├─ benchmarks/             # 预留：评测数据
├─ docs/                   # 预留：设计文档
├─ .env.example
└─ README.md
```

## 快速启动

### 环境要求

- Python 3.12+
- Node.js 20+
- Git
- OpenAI API Key

### 1. 配置环境变量

```powershell
Copy-Item .env.example .env
```

至少需要配置：

- `OPENAI_API_KEY`

可选配置：

- `CODE_AGENT_OPENAI_MODEL`
- `CODE_AGENT_GIT_CLONE_TIMEOUT_SECONDS`
- `CODE_AGENT_GIT_CLONE_DEPTH`

### 2. 启动后端

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
```

可访问：

- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. 启动前端

```powershell
cd frontend
npm install
npm run dev
```

可访问：

- Frontend: [http://localhost:3000](http://localhost:3000)

### 4. 最小使用流程

1. 导入一个本地仓库或 GitHub 仓库
2. 触发索引
3. 在前端工作台发起代码问答
4. 查看回答、引用和工具调用摘要
5. 如需改动，生成 patch 草案并预览 diff
6. 确认后应用 patch 并运行 checks

## 示例问答

下面是一个典型的使用方式：

**问题**

```text
这个仓库的索引流程是怎么工作的？关键入口在哪里？
```

**Agent 可能执行的工具链**

```text
1. search_repo(query="indexing")
2. read_file(path="backend/app/services/indexing_service.py")
3. read_file(path="backend/app/api/routes/repositories.py")
```

**回答示例**

```text
索引入口在 repositories 路由的 POST /api/repositories/{repo_id}/index。
实际执行逻辑在 IndexingService.request_index：

- 先解析仓库工作区根目录
- 扫描文件并过滤无关目录/二进制文件
- 按行切分文本文件为 chunk
- 将 FileChunk 写入 SQLite
- 更新 Repository 的状态和 primary_language
```

**引用示例**

```text
- backend/app/api/routes/repositories.py:88
- backend/app/services/indexing_service.py:17
```

这部分体现的不是“模型自己知道答案”，而是：

- Agent 先调用工具找证据
- 再基于证据组织回答
- 最终把引用返回给用户

## 关键实现思路

### 1. 用统一工作区抽象屏蔽仓库来源差异

无论仓库来自本地路径还是 GitHub clone，系统最终都把它映射为一个可访问的 `root_path`。这样后续的索引、检索、问答、patch、checks 都可以复用同一套逻辑，而不需要为不同来源维护两套分支。

### 2. 用轻量索引先建立可用的工程上下文

当前版本没有直接引入向量库，而是先采用最稳妥的基础方案：

- 扫描文本文件
- 忽略 `.git`、`node_modules`、`dist` 等目录
- 按固定窗口和重叠行数切分 chunk
- 将 chunk、路径、行号、语言等信息写入 SQLite

这种设计实现成本低，但已经足够支持关键词检索、文件阅读、引用定位和下一阶段的语义增强。

### 3. Agent 不直接“看全仓库”，而是通过工具受控访问

问答主流程的重点是工具化，而不是把整个仓库直接塞进 prompt。当前 Agent 通过以下工具访问代码：

- `list_repo_tree`
- `search_repo`
- `read_file`
- `find_symbol`

这样做有三个好处：

- 可追踪：知道模型到底读了什么
- 可解释：可以把引用和调用摘要返回给用户
- 可扩展：后续加入 AST、embedding、rerank 时不需要重写主流程

### 4. Patch 流程强调“预览优先”

改动能力分成几个清晰步骤：

1. 生成 patch 草案
2. 展示 unified diff
3. 用户确认后再应用
4. 应用后执行 checks

这让系统更接近工程协作中的 code review，而不是“让模型直接改文件”。

### 5. Checks 采用白名单策略

当前闭环不是开放任意 Shell，而是只发现和执行安全白名单内的检查，例如：

- `python -m pytest tests`
- `npm run typecheck`
- `npm run lint`
- `npm run test`

这既降低了执行风险，也让系统输出更可控。

## 风险控制

这个项目在设计上刻意保留了多层风险控制：

- 工具受控：Agent 只能访问约定好的 search/read/tree/symbol 工具，不直接任意执行命令。
- 路径约束：所有文件访问都要求停留在仓库根目录内，避免越界读取或写入。
- 证据引用：回答不是只给结论，还返回路径与行号，便于人工复核。
- Patch 预览：所有改动先生成草案和 diff，不直接静默落盘。
- 哈希校验：应用 patch 前会校验文件基线哈希，避免覆盖已经变化的文件。
- 批量写回保护：多文件 apply 采用先校验、后整体写入的策略，避免半成功状态。
- 检查白名单：lint/test 只运行系统识别的安全命令，不开放任意命令执行。
- 文件扫描限制：跳过超大文件、二进制文件和常见构建产物，降低索引噪声和性能风险。

当前还没有完全覆盖的风险包括：

- checks 失败后的自动回滚
- 更细粒度的权限与多用户隔离
- 更完善的导入审计与后台任务治理

## 后续规划

下一步的增强重点会放在“检索质量”和“生产化能力”两个方向：

- 引入 embedding / rerank，提高跨文件语义检索效果
- 加入 AST 或语言感知的 symbol 分析，提升定位精度
- 将 checks 推荐从“按路径”升级为“结合 diff 内容和历史失败”
- 增加 benchmark 数据与问答评测，形成更明确的效果反馈
- 支持 checks 失败后的回滚建议与修复流
- 进一步完善后台任务队列、导入审计和运行可观测性

## 适合作品集展示的点

如果把这个仓库作为作品集项目，它最值得被看到的不是“用了 AI”，而是它体现了下面几件事情：

- 能把 LLM 系统设计成受控的工程工具，而不是黑盒聊天
- 能把检索、证据、改动、验证串成完整产品链路
- 能在功能推进时持续保留扩展性和风险边界
- 能从 MVP 出发，逐步演进到更接近真实研发工作流的 Agent 系统

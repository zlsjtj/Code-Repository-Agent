# CodeAtlas 

是一种代码智能工作流，用于索引代码库、在源文件中定位答案、起草候选补丁以及通过受控检查来验证更改。

一个面向代码仓库的工程化 AI Agent 项目，覆盖代码问答、证据引用、修改草案和基础验证闭环。

项目目标很直接：让模型围绕真实仓库完成“找代码、读代码、回答问题、生成改动、运行检查”这条链路，而不是停留在单纯的聊天界面。

## 项目概览

这个项目主要解决几类开发中很常见的问题：

- 一个模块到底做什么
- 关键入口和核心接口在哪
- 某个问题可能出在哪几层
- 修改应该先落到哪些文件
- 改完之后怎么快速验证

对应的系统能力是：

- 导入本地仓库或 GitHub 仓库
- 构建基础代码索引
- 通过受控工具检索代码、读取文件、定位符号
- 基于证据回答问题并返回引用
- 生成 patch 草案和 unified diff 预览
- 在安全约束下运行 `lint / test`

## 核心能力

- 仓库导入：支持本地目录，也支持将 GitHub 仓库 clone 到受管目录后继续处理。
- 基础索引：扫描文件树、过滤无关目录和大文件、按行切分代码片段并写入 SQLite。
- 检索工具：提供 `list_repo_tree`、`search_repo`、`read_file`、`find_symbol`。
- Agent 问答：通过 OpenAI Agents SDK 调用工具后回答问题，并返回引用和调用摘要。
- Patch 草案：支持单文件和多文件草案、diff 预览、确认式应用。
- 验证闭环：支持白名单内的 `pytest`、`npm run typecheck`、`npm run lint`、`npm run test`。
- 风险控制：通过路径约束、哈希校验、白名单命令和分步确认降低误改风险。

## 技术栈

- Backend: `FastAPI`
- Frontend: `Next.js`
- Agent Runtime: `OpenAI Agents SDK`
- Storage: `SQLite`
- ORM: `SQLAlchemy`
- API Contract: `FastAPI OpenAPI -> openapi-typescript -> frontend/lib/generated/api-types.ts`

## 系统架构

```text
+---------------------------+
|       Next.js Frontend    |
| chat / citations / patch  |
+------------+--------------+
             |
             | HTTP API
             v
+---------------------------+
|      FastAPI Backend      |
| routes / services / APIs  |
+------------+--------------+
             |
   +---------+---------+--------------------+
   |                   |                    |
   v                   v                    v
+--------+     +---------------+     +--------------+
| Agent  |     | Tool Runtime  |     | Patch/Checks |
| Runner |     | tree/search   |     | diff/apply   |
| OpenAI |     | read/symbol   |     | lint/test    |
+----+---+     +-------+-------+     +------+-------+
     |                   |                    |
     v                   v                    v
+---------------------------------------------------+
|                Repository Workspace               |
| local repo / cloned GitHub repo / scanned files  |
+----------------------+----------------------------+
                       |
                       v
+---------------------------------------------------+
| SQLite                                             |
| Repository / FileChunk / ConversationTrace         |
+---------------------------------------------------+
```

主链路如下：

1. 导入仓库并建立工作区
2. 扫描文件并生成索引
3. Agent 通过工具检索上下文
4. 返回答案、引用和工具调用摘要
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
│  ├─ app/
│  ├─ components/
│  ├─ lib/
│  └─ package.json
├─ data/                   # SQLite 数据与运行时文件
├─ repos/                  # GitHub clone 目录
├─ benchmarks/             # 预留：评测数据
├─ docs/                   # 预留：文档与设计材料
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

访问：

- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. 启动前端

```powershell
cd frontend
npm install
npm run dev
```

访问：

- Frontend: [http://localhost:3000](http://localhost:3000)

### 4. 最小使用流程

1. 导入一个本地仓库或 GitHub 仓库
2. 触发索引
3. 在前端工作台提问
4. 查看回答、引用和工具调用摘要
5. 生成 patch 草案并预览 diff
6. 应用 patch 并运行 checks

## 示例问答

问题：

```text
这个仓库的索引流程是怎么工作的？关键入口在哪里？
```

Agent 可能执行的工具链：

```text
1. search_repo(query="indexing")
2. read_file(path="backend/app/services/indexing_service.py")
3. read_file(path="backend/app/api/routes/repositories.py")
```

回答示例：

```text
索引入口在 POST /api/repositories/{repo_id}/index。
实际执行逻辑在 IndexingService.request_index：

- 解析仓库工作区根目录
- 扫描文件并过滤无关目录和二进制文件
- 按行切分文本文件为 chunk
- 将 FileChunk 写入 SQLite
- 更新 Repository 的状态和 primary_language
```

引用示例：

```text
- backend/app/api/routes/repositories.py:88
- backend/app/services/indexing_service.py:17
```

## 关键实现思路

### 1. 统一仓库工作区抽象

无论仓库来自本地路径还是 GitHub clone，系统最终都映射到一个可访问的 `root_path`。这样索引、问答、patch、checks 都可以复用同一套流程。

### 2. 先做轻量索引，再逐步增强

当前索引基于文件扫描和行级 chunk，而不是一开始就引入向量库。这样实现成本更低，也更适合先验证主链路。后续可以在现有结构上继续接 embedding、rerank 或 AST 分析。

### 3. 通过工具而不是整仓 prompt 访问代码

问答流程不是把整个仓库直接塞给模型，而是通过 `tree/search/read/symbol` 工具按需获取上下文。这样更节省上下文，也更容易追踪模型到底读了哪些证据。

### 4. Patch 采用预览优先的流程

改动能力按“草案 -> diff -> 确认 -> 应用 -> checks”推进。这样更接近实际开发里的 review 过程，也避免模型直接静默修改文件。

### 5. Checks 使用白名单策略

系统只运行识别到的安全命令，不开放任意执行。当前主要覆盖：

- `python -m pytest tests`
- `npm run typecheck`
- `npm run lint`
- `npm run test`

## 风险控制

- 路径约束：文件访问和写入都限制在仓库根目录内。
- 引用返回：回答包含路径和行号，便于人工复核。
- Patch 预览：所有改动先出草案和 diff，不直接落盘。
- 哈希校验：应用 patch 前校验文件基线内容，避免覆盖已变化文件。
- 检查失败回滚：`apply-and-checks` 会在 checks 失败时恢复已写入文件，避免把失败改动留在工作区。
- 批量写回保护：多文件 apply 采用先校验、后整体写入，避免半成功状态。
- 白名单执行：checks 只运行系统识别的安全命令。
- 扫描限制：跳过超大文件、二进制文件和常见构建产物，减少噪声和性能风险。

当前还没有完全覆盖的点：

- 更细粒度的权限与多用户隔离
- 更完善的导入审计与后台任务治理
- 更强的检索质量评测和回归基准

## 后续规划

- 引入 embedding / rerank，提高跨文件语义检索效果
- 加入 AST 或语言感知的 symbol 分析，提升定位精度
- 将 checks 推荐从“按路径”升级为“结合 diff 内容和历史失败”
- 增加 benchmark 数据与问答评测
- 支持 checks 失败后的回滚建议、失败归因与修复流
- 完善后台任务队列、导入审计和运行可观测性

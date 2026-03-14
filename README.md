# 代码库问答与改动助手（AI Agent）

面向本地代码仓库与 GitHub 仓库的工程化 AI Agent 项目。当前已完成前两阶段的最小可运行版本：

- 第一阶段：项目骨架、FastAPI、Next.js、SQLite schema、健康检查、仓库导入
- 第二阶段：本地仓库扫描、文件树接口、基础 chunk 索引、索引状态与调试查询

项目目标不是做一个“会聊天的网页”，而是做一个“能围绕代码任务调用工具、引用证据、逐步扩展到改动建议和检查闭环”的代码助手。

## 当前进度

当前仓库已经支持：

- 登记本地仓库路径
- 保存 GitHub 仓库元信息
- 扫描本地仓库文件树
- 过滤常见无关目录、二进制文件和超大文件
- 按行切分文本文件并写入 `FileChunk`
- 查询索引状态
- 查询部分 chunk，便于调试下一阶段检索工具
- 在前端工作台直接触发索引

当前仍未实现：

- GitHub 仓库克隆
- 关键词检索 / 语义检索
- `read_file` / `find_symbol`
- OpenAI Agents SDK 问答主流程
- patch 草案、diff 预览、lint/test 闭环

## 项目目录

```text
.
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ router.py
│  │  │  └─ routes/
│  │  │     ├─ health.py
│  │  │     └─ repositories.py
│  │  ├─ agents/
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
│  │  │  └─ repository.py
│  │  ├─ services/
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

### 前端

- Next.js App Router 基础结构
- 首页工作台
- 后端健康状态探测
- 仓库导入表单
- 已登记仓库列表
- 触发索引按钮
- 问答区与引用区占位

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
6. 打开前端首页，点击“触发索引”，确认能看到成功提示

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

## 设计取舍

当前实现刻意保持简单：

- 索引同步执行，不引入任务队列
- 不做 embedding，不引入向量库
- 不做 GitHub 自动克隆
- 不做 AST 级符号解析
- 不做复杂权限和多用户设计

这让第二阶段能尽快形成可验证的索引基础层，后续新增工具时不需要返工核心数据结构。

## 下一阶段

第三阶段建议优先实现：

1. `search_repo`
2. `read_file`
3. `find_symbol`
4. 统一工具返回结构
5. 为 OpenAI Agents SDK 问答主流程准备工具层


# 代码库问答与改动助手（AI Agent）

面向本地代码仓库与 GitHub 仓库的工程化 AI Agent 项目。第一阶段先完成项目骨架搭建：FastAPI 后端、Next.js 前端、SQLite schema、健康检查接口和仓库导入占位接口，为后续的索引、检索、Agent 工具调用、patch 草案和 lint/test 闭环预留清晰扩展点。

## 当前阶段

当前仓库已完成第一阶段骨架：

- 严格按项目说明书建议创建目录结构
- 搭建 FastAPI 后端基础结构
- 搭建 Next.js 前端基础结构
- 定义 SQLite 数据模型：`Repository`、`FileChunk`、`ConversationTrace`
- 提供健康检查 API、基础元信息 API、仓库导入占位接口、索引触发占位接口
- 预留 `agents/`、`tools/`、`indexing/` 目录，暂不实现复杂 Agent 逻辑

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
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ repositories/
│  │     └─ page.tsx
│  ├─ components/
│  │  ├─ chat/
│  │  ├─ citations/
│  │  ├─ repositories/
│  │  └─ workspace-shell.tsx
│  ├─ lib/
│  │  ├─ api.ts
│  │  └─ types.ts
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

## 第一阶段已实现能力

### 后端

- FastAPI 应用入口与统一路由注册
- 基于 SQLite 的 SQLAlchemy 数据库初始化
- `Repository`、`FileChunk`、`ConversationTrace` 三张核心表
- 仓库登记服务：
  - 本地仓库路径校验
  - GitHub 仓库元信息登记
  - 列表查询与详情查询
- 索引触发占位服务：
  - 仅返回“第二阶段实现”的占位响应

### 前端

- Next.js App Router 基础结构
- 首页工作台
- 后端健康状态探测
- 仓库导入表单
- 已登记仓库列表
- 问答面板与引用面板占位区

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

为第二阶段文件扫描与切分预留。

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

为后续问答 trace、工具调用记录和引用链路预留。

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

当前已实现的接口：

- `GET /api/health`
  - 返回服务健康状态

- `GET /api/meta`
  - 返回应用名称、版本和当前阶段能力开关

- `GET /api/repositories`
  - 返回已登记仓库列表

- `POST /api/repositories`
  - 登记本地仓库路径或 GitHub 仓库元信息

- `GET /api/repositories/{repo_id}`
  - 返回单个仓库详情

- `POST /api/repositories/{repo_id}/index`
  - 索引触发占位接口
  - 当前只返回提示信息，不执行扫描或切分

## 快速启动

### 1. 准备环境变量

在仓库根目录复制环境变量模板：

```powershell
Copy-Item .env.example .env
```

默认配置会把 SQLite 放在 `data/` 下，把后续导入仓库放在 `repos/` 下。

### 2. 启动后端

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
```

启动后可访问：

- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. 启动前端

新开一个终端：

```powershell
cd frontend
npm install
npm run dev
```

启动后可访问：

- Frontend: [http://localhost:3000](http://localhost:3000)

## 第一阶段验证

建议按下面顺序验证：

1. 访问 `GET /api/health`，确认返回 `status=ok`
2. 打开 `http://localhost:8000/docs`，调用 `POST /api/repositories`
3. 用本地目录测试一个 `local` 类型导入
4. 再调用 `GET /api/repositories`，确认记录已写入 SQLite
5. 打开前端首页，确认能看到：
   - 后端健康状态
   - 能力开关
   - 仓库导入表单
   - 仓库记录列表

本地仓库导入示例：

```json
{
  "source_type": "local",
  "root_path": "E:\\AI Agent\\1Code Repository Agent"
}
```

GitHub 仓库元信息示例：

```json
{
  "source_type": "github",
  "source_url": "https://github.com/example/repo",
  "default_branch": "main"
}
```

## 测试

后端已预留基础测试：

```powershell
cd backend
python -m pytest
```

当前测试覆盖：

- 健康检查接口
- 本地仓库导入与列表接口

## 设计取舍

第一阶段刻意保持简单：

- 只做仓库登记，不做真实克隆
- 只做 schema 和占位服务，不做真实文件扫描
- 只预留 `agents/`、`tools/`、`indexing/`，不提前堆复杂抽象
- 只做工作台首页，不提前做复杂会话流和状态管理

这样做的目的是先把项目骨架、目录边界和基础数据契约定稳，再进入下一阶段。

## 下一阶段

第二阶段建议优先实现：

1. 仓库文件树扫描
2. 过滤规则与 chunk 切分
3. `FileChunk` 写入 SQLite
4. `GET /repositories/{repo_id}/tree`
5. `POST /repositories/{repo_id}/index` 从占位接口升级为真实索引入口


# CodeAtlas

[![CI](https://github.com/zlsjtj/CodeAtlas/actions/workflows/ci.yml/badge.svg)](https://github.com/zlsjtj/CodeAtlas/actions/workflows/ci.yml)

CodeAtlas 是一个面向代码仓库的问答和改动辅助工具。它的目标不大：导入一个仓库后，先做基础索引，再让模型通过受控工具去找文件、读代码、给出带引用的回答；如果需要修改代码，可以先生成草案和 diff，确认后再写入工作区并运行检查。

这个项目目前更接近一个本科阶段的工程实践 MVP，而不是完整产品。重点放在主流程是否跑得通，以及模型参与代码任务时有哪些地方需要约束。

## 目前能做什么

- 导入本地仓库，或从 GitHub clone 一个仓库到受管目录。
- 扫描仓库文件，过滤常见构建产物和二进制文件，把文本文件按行切成 chunk 后写入 SQLite。
- 提供 `list_repo_tree`、`search_repo`、`read_file`、`find_symbol` 四个仓库检索工具。
- 问答时要求模型先调用工具，再基于工具结果回答，并返回引用和工具调用摘要。
- 对单文件或少量文件生成 patch 草案，展示 unified diff。
- 应用 patch 前校验文件内容哈希，避免覆盖草案生成之后发生变化的文件。
- 根据仓库结构发现一小部分安全检查命令，例如 `pytest`、`npm run typecheck`、`npm run lint`、`npm run test`。
- 支持“应用改动并运行检查”，检查失败时把本次写入的文件恢复回去。

## 暂时没有解决的问题

- 检索还是关键词和行级 chunk，没有接 embedding、rerank 或 AST 级索引。
- 没有做权限、多用户隔离和完整审计，只适合本地或受信环境使用。
- 后台任务还是轻量实现，没有引入 Celery、Redis 这类任务系统。
- Patch 草案依赖模型输出完整文件内容，文件较大时不适合使用。
- benchmark 目前只是少量手写 smoke cases，还不是自动化评测体系。
- 前端偏工作台原型，交互能覆盖主流程，但还没有做成成熟 IDE 插件体验。

## 技术栈

- Backend: `FastAPI`
- Frontend: `Next.js`
- Model runtime: `OpenAI Agents SDK`
- Storage: `SQLite`
- ORM: `SQLAlchemy`
- API 类型同步: `FastAPI OpenAPI -> openapi-typescript`

## 主流程

```text
Next.js workspace
  |
  | HTTP API
  v
FastAPI backend
  |
  +-- repository import
  +-- file scan and chunk index
  +-- model tools: tree / search / read / symbol
  +-- patch draft / apply
  +-- checks discovery / run
  |
  v
SQLite + managed repository workspace
```

一次典型使用流程：

1. 导入本地仓库或 GitHub 仓库。
2. 触发索引。
3. 在工作台里提问。
4. 查看回答、引用和工具调用摘要。
5. 需要修改时生成 patch 草案。
6. 预览 diff，确认后应用。
7. 运行推荐检查，失败时回滚本次写入。

## 目录结构

```text
.
├─ backend/
│  ├─ app/
│  │  ├─ api/          # FastAPI 路由
│  │  ├─ agents/       # Agents SDK 相关定义
│  │  ├─ checks/       # 检查项发现和推荐
│  │  ├─ core/         # 配置、数据库
│  │  ├─ indexing/     # 文件扫描和 chunk 切分
│  │  ├─ models/       # SQLAlchemy 模型
│  │  ├─ schemas/      # Pydantic 请求/响应模型
│  │  ├─ services/     # 主要业务逻辑
│  │  └─ tools/        # 给模型调用的仓库工具
│  ├─ tests/
│  └─ pyproject.toml
├─ frontend/
│  ├─ app/
│  ├─ components/
│  └─ lib/
├─ benchmarks/
├─ docs/
├─ data/               # 本地运行时数据，默认不提交
└─ repos/              # clone 下来的仓库，默认不提交
```

## 快速启动

环境要求：

- Python 3.11+
- Node.js 20+
- Git
- OpenAI API Key

配置环境变量：

```powershell
Copy-Item .env.example .env
```

至少需要设置：

```text
OPENAI_API_KEY=...
```

启动后端：

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
```

启动前端：

```powershell
cd frontend
npm install
npm run dev
```

访问：

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

## 实现取舍

这个项目里有几处是刻意做得比较简单的：

- 索引层先用文件扫描和行级 chunk。这样可以先验证“导入 -> 检索 -> 引用回答”的链路，后面再替换成向量检索或 AST 索引。
- 仓库统一抽象成 `root_path`。本地目录和 GitHub clone 后续都走同一套索引、问答、patch 和 checks 逻辑。
- 模型只能通过工具读仓库，不直接把整个仓库塞进 prompt。这样更容易知道它读过哪些证据。
- Patch 先做草案和 diff，再应用。应用前用 sha256 校验基线内容，避免覆盖用户在草案生成后做出的修改。
- Checks 只运行发现到的白名单命令，不开放任意命令执行。

更详细的设计记录见 [docs/design-notes.md](docs/design-notes.md)。

## 测试

仓库里配置了 GitHub Actions，会在 push 和 pull request 时运行后端测试和前端类型检查。

后端测试主要覆盖仓库导入、索引、检索工具、问答接口、patch 应用、批量应用、checks 和失败回滚：

```powershell
cd backend
python -m pytest
```

前端目前主要依赖 TypeScript 检查：

```powershell
cd frontend
npm run typecheck
```

## 下一步

- 给检索层补 embedding / rerank 对比实验。
- 增加可执行的 benchmark，而不是只保留 smoke cases。
- 把 symbol 查找从简单匹配升级到语言感知实现。
- 改进后台任务队列和导入失败后的恢复。
- 给前端补截图、状态空页面和更完整的错误展示。

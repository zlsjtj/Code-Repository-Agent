# Benchmarks

这里放了少量手写的问答检查样例，用来发现明显的检索或引用退化。它只检查预期文件有没有出现在引用里，不评价回答文字质量。

目前包含：

- `smoke_cases.json`：几条针对本仓库的问答样例。
- `run_smoke_cases.py`：调用一个正在运行的 CodeAtlas 后端，逐条提问并核对引用路径。
- 后端测试会检查样例格式和路径匹配逻辑。

## 运行

先启动后端，在 CodeAtlas 中导入并索引当前仓库，记下仓库 ID。然后在项目根目录运行：

```powershell
python benchmarks/run_smoke_cases.py --repo-id 1
```

也可以指定其他后端地址或 case 文件：

```powershell
python benchmarks/run_smoke_cases.py `
  --repo-id 1 `
  --base-url http://localhost:8000 `
  --cases benchmarks/smoke_cases.json
```

每条 case 会输出 `PASS` 或 `FAIL`。只要有预期引用缺失，脚本就以状态码 1 退出，方便在本地脚本或后续 CI 中使用。

## 后续扩展

1. 每次发现检索或回答退化时，补一条具体 case。
2. 样例问题尽量和仓库文件绑定，不写泛泛的开放问题。
3. case 数量多起来以后，再考虑回答内容和稳定性的打分方式。

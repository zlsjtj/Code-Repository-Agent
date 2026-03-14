"use client";

import { FormEvent, useState } from "react";

import type { RepositoryCreatePayload, RepositorySourceType } from "@/lib/types";

type RepositoryImportFormProps = {
  isSubmitting: boolean;
  onSubmit: (payload: RepositoryCreatePayload) => Promise<void> | void;
};

type FormState = {
  name: string;
  source_type: RepositorySourceType;
  root_path: string;
  source_url: string;
  default_branch: string;
};

const initialState: FormState = {
  name: "",
  source_type: "local",
  root_path: "",
  source_url: "",
  default_branch: "main",
};

export function RepositoryImportForm({
  isSubmitting,
  onSubmit,
}: RepositoryImportFormProps) {
  const [form, setForm] = useState<FormState>(initialState);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: RepositoryCreatePayload = {
      name: form.name.trim() || undefined,
      source_type: form.source_type,
    };

    if (form.source_type === "local") {
      payload.root_path = form.root_path.trim();
    } else {
      payload.source_url = form.source_url.trim();
      payload.default_branch = form.default_branch.trim() || undefined;
    }

    await onSubmit(payload);
  }

  return (
    <section className="panel-card">
      <h2 className="panel-title">仓库导入占位接口</h2>
      <p className="panel-copy">
        这一版先支持登记本地仓库路径或 GitHub 仓库元信息。真正的克隆、扫描和 chunk 索引会放到下一阶段实现。
      </p>
      <form className="field-grid" onSubmit={handleSubmit}>
        <div className="field-row">
          <label className="field-label">
            仓库名称（可选）
            <input
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="例如 code-repo-agent"
              value={form.name}
            />
          </label>
          <label className="field-label">
            来源类型
            <select
              onChange={(event) =>
                updateField("source_type", event.target.value as RepositorySourceType)
              }
              value={form.source_type}
            >
              <option value="local">本地仓库</option>
              <option value="github">GitHub 仓库</option>
            </select>
          </label>
        </div>

        {form.source_type === "local" ? (
          <label className="field-label">
            本地仓库路径
            <input
              onChange={(event) => updateField("root_path", event.target.value)}
              placeholder="例如 E:\\AI Agent\\demo-repo"
              value={form.root_path}
            />
          </label>
        ) : (
          <div className="field-row">
            <label className="field-label">
              GitHub 仓库地址
              <input
                onChange={(event) => updateField("source_url", event.target.value)}
                placeholder="https://github.com/org/repo"
                value={form.source_url}
              />
            </label>
            <label className="field-label">
              默认分支
              <input
                onChange={(event) => updateField("default_branch", event.target.value)}
                placeholder="main"
                value={form.default_branch}
              />
            </label>
          </div>
        )}

        <p className="field-help">
          第一阶段只校验并保存基础元信息，不会在后台执行克隆、扫描或索引。
        </p>

        <div className="button-row">
          <button className="button-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "提交中..." : "登记仓库"}
          </button>
          <button
            className="button-secondary"
            disabled={isSubmitting}
            onClick={() => setForm(initialState)}
            type="button"
          >
            重置表单
          </button>
        </div>
      </form>
    </section>
  );
}


"use client";

import { useEffect, useMemo, useState } from "react";
import CurrentDateTime from "@/components/CurrentDateTime";
import TemplateForm, { type TemplatePayload } from "@/components/TemplateForm";
import type { TemplateType } from "@/lib/db";

type Template = TemplatePayload & { id: number };

const labels: Record<TemplateType, string> = {
  checkin: "出勤テンプレート",
  checkout: "退勤テンプレート",
};

export default function SettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Template | null>(null);
  const [creatingType, setCreatingType] = useState<TemplateType | null>(null);
  const [loadError, setLoadError] = useState("");

  const loadTemplates = async () => {
    const res = await fetch("/api/templates", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("テンプレートの取得に失敗しました");
    }
    const data = await res.json();
    setTemplates(data.templates ?? []);
  };

  useEffect(() => {
    fetch("/api/templates", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("テンプレートの取得に失敗しました");
        }
        return res.json();
      })
      .then((data) => {
        setTemplates(data.templates ?? []);
      })
      .catch((error) => {
        console.error(error);
        setLoadError("テンプレートの読み込みに失敗しました");
      });
  }, []);

  const grouped = useMemo(
    () => ({
      checkin: templates.find((template) => template.type === "checkin"),
      checkout: templates.find((template) => template.type === "checkout"),
    }),
    [templates],
  );

  const saveTemplate = async (payload: TemplatePayload) => {
    await fetch("/api/templates", {
      method: payload.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setEditing(null);
    setCreatingType(null);
    try {
      await loadTemplates();
      setLoadError("");
    } catch {
      setLoadError("テンプレートの再読み込みに失敗しました");
    }
  };

  const renderSection = (type: TemplateType) => {
    const template = grouped[type];
    return (
      <section className="space-y-3 rounded border bg-gray-50 p-4" key={type}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{labels[type]}</h2>
        {!template ? (
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-2 text-white"
            onClick={() => {
              setCreatingType(type);
              setEditing(null);
            }}
          >
            新規作成
          </button>
        ) : null}
      </div>

      {!template ? <p className="text-sm text-gray-600">未登録です。</p> : null}
      {template ? (
        <ul className="space-y-2">
          <li key={template.id} className="rounded border bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{template.title.trim() || "（冒頭未設定）"}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border px-3 py-1"
                  onClick={() => {
                    setEditing(template);
                    setCreatingType(null);
                  }}
                >
                  編集
                </button>
              </div>
            </div>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {template.items.map((item, index) => (
                <li key={`${template.id}-${index}`}>{item}</li>
              ))}
            </ul>
          </li>
        </ul>
      ) : null}

      {creatingType === type ? (
        <TemplateForm type={type} onSave={saveTemplate} onCancel={() => setCreatingType(null)} />
      ) : null}

      {editing && editing.type === type ? (
        <TemplateForm
          type={type}
          initialValue={editing}
          onSave={saveTemplate}
          onCancel={() => setEditing(null)}
        />
      ) : null}
    </section>
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">設定</h1>
      <CurrentDateTime />
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
      {renderSection("checkin")}
      {renderSection("checkout")}
    </div>
  );
}

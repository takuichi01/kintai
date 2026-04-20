"use client";

import { useMemo, useState } from "react";
import type { TemplateType } from "@/lib/db";

export type TemplatePayload = {
  id?: number;
  type: TemplateType;
  title: string;
  items: string[];
};

type Props = {
  type: TemplateType;
  initialValue?: TemplatePayload;
  onSave: (payload: TemplatePayload) => Promise<void>;
  onCancel?: () => void;
};

export default function TemplateForm({ type, initialValue, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [items, setItems] = useState<string[]>(
    initialValue?.items.length ? initialValue.items : [""],
  );
  const [saving, setSaving] = useState(false);

  const heading = useMemo(() => (type === "checkin" ? "出勤テンプレート" : "退勤テンプレート"), [type]);

  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    setItems(next);
  };

  const addItem = () => setItems((prev) => [...prev, ""]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: initialValue?.id,
        type,
        title: title.trim(),
        items,
      });
      if (!initialValue) {
        setTitle("");
        setItems([""]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded border bg-white p-4">
      <h3 className="font-semibold">{initialValue ? `${heading}編集` : `${heading}新規作成`}</h3>
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="タイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <div className="space-y-2">
        {items.map((item, index) => (
          <div className="flex gap-2" key={`${type}-${index}`}>
            <input
              className="flex-1 rounded border px-3 py-2"
              placeholder="箇条書き項目"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <button
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
            >
              削除
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addItem} className="rounded border px-3 py-2">
        項目追加
      </button>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white">
          保存
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="rounded border px-4 py-2">
            キャンセル
          </button>
        ) : null}
      </div>
    </form>
  );
}

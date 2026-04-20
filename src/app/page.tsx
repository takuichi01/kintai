"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CopyButton from "@/components/CopyButton";

type AttendanceContext = {
  template: {
    title: string;
    items: string[];
  } | null;
  previousTodos: string[];
};

function buildCheckinMessage(context: AttendanceContext): string {
  const todos =
    context.previousTodos.length > 0
      ? context.previousTodos.map((todo) => `• ${todo}`).join("\n")
      : "• 前回稼働日のTODOはありません";

  const templateTitle = context.template?.title ?? "出勤テンプレート未設定";
  const templateItems =
    context.template?.items.length
      ? context.template.items.map((item) => `• ${item}`).join("\n")
      : "• 設定画面でテンプレートを登録してください";

  return `【出勤】\nおはようございます。本日もよろしくお願いします。\n\n■ 本日のTODO\n${todos}\n\n■ ${templateTitle}\n${templateItems}`;
}

export default function HomePage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/attendance?action=checkin-context", { cache: "no-store" });
      const data = (await res.json()) as AttendanceContext;
      setMessage(buildCheckinMessage(data));
    } catch (error) {
      console.error(error);
      setError("文章の生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const onComplete = async () => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      });
      if (!res.ok) {
        throw new Error("出勤記録に失敗しました");
      }
      router.push("/work-report");
    } catch (error) {
      console.error(error);
      setError("出勤記録に失敗しました");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">出勤画面</h1>
      <button
        type="button"
        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        onClick={onGenerate}
        disabled={loading}
      >
        出勤
      </button>
      {error ? <p className="text-red-600">{error}</p> : null}
      {message ? (
        <div className="space-y-3 rounded border bg-white p-4">
          <pre className="whitespace-pre-wrap">{message}</pre>
          <div className="flex gap-2">
            <CopyButton text={message} />
            <button
              type="button"
              className="rounded bg-blue-600 px-4 py-2 text-white"
              onClick={onComplete}
            >
              報告完了
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">出勤ボタンを押すとSlack向け文章を生成します。</p>
      )}
    </div>
  );
}

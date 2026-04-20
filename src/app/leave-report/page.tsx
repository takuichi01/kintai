"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CurrentDateTime from "@/components/CurrentDateTime";
import CopyButton from "@/components/CopyButton";

type CheckoutContext = {
  template: {
    title: string;
    items: string[];
  } | null;
  workReports: {
    title: string;
    start_time: string;
    end_time: string;
  }[];
};

function buildCheckoutMessage(context: CheckoutContext): string {
  const workLines =
    context.workReports.length > 0
      ? context.workReports
          .map((report) => `• ${report.title} (${report.start_time || "--:--"} 〜 ${report.end_time || "--:--"})`)
          .join("\n")
      : "• 本日の作業報告はありません";

  const opening = context.template?.title.trim() || "（退勤テンプレートの冒頭が未設定です）";
  const supplement =
    context.template?.items.length
      ? `\n\n■ 補足\n${context.template.items.map((item) => `• ${item}`).join("\n")}`
      : "";

  return `${opening}\n\n■ 本日の作業内容\n${workLines}${supplement}`;
}

export default function LeaveReportPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/attendance?action=checkout-context", { cache: "no-store" });
      const data = (await res.json()) as CheckoutContext;
      setMessage(buildCheckoutMessage(data));
    };

    load();
  }, []);

  const complete = async () => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      if (!res.ok) {
        throw new Error("退勤記録に失敗しました");
      }
      router.push("/");
    } catch (fetchError) {
      console.error(fetchError);
      setError("退勤記録に失敗しました");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">退勤前報告</h1>
      <CurrentDateTime />
      {message ? (
        <div className="space-y-3 rounded border bg-white p-4">
          <textarea
            className="w-full rounded border px-3 py-2 font-mono text-sm whitespace-pre-wrap"
            rows={12}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <CopyButton text={message} />
            <button type="button" className="rounded bg-blue-600 px-4 py-2 text-white" onClick={complete}>
              報告完了
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">文章を生成しています...</p>
      )}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

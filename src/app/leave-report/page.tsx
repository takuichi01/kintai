"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  const templateTitle = context.template?.title ?? "退勤テンプレート未設定";
  const templateLines =
    context.template?.items.length
      ? context.template.items.map((item) => `• ${item}`).join("\n")
      : "• 設定画面でテンプレートを登録してください";

  return `【退勤】\nお疲れ様でした。本日の作業報告です。\n\n■ 本日の作業内容\n${workLines}\n\n■ ${templateTitle}\n${templateLines}`;
}

export default function LeaveReportPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/attendance?action=checkout-context", { cache: "no-store" });
      const data = (await res.json()) as CheckoutContext;
      setMessage(buildCheckoutMessage(data));
    };

    void load();
  }, []);

  const complete = async () => {
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkout" }),
    });
    router.push("/");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">退勤前報告</h1>
      {message ? (
        <div className="space-y-3 rounded border bg-white p-4">
          <pre className="whitespace-pre-wrap">{message}</pre>
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
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WorkReportForm from "@/components/WorkReportForm";
import type { BreakReportInput, WorkReportInput } from "@/lib/db";

type Tab = "work" | "break";

const defaultWork: WorkReportInput = {
  start_time: "",
  end_time: "",
  title: "",
  content: "",
  issues: "",
  evaluation: "普通",
};

const defaultBreak: BreakReportInput = {
  start_time: "",
  end_time: "",
};

export default function WorkReportPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("work");
  const [workReports, setWorkReports] = useState<WorkReportInput[]>([defaultWork]);
  const [breakReports, setBreakReports] = useState<BreakReportInput[]>([defaultBreak]);
  const [todos, setTodos] = useState<string[]>([""]);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/work-reports", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("作業報告の取得に失敗しました");
        }
        const data = await res.json();
        if (data.workReports?.length) setWorkReports(data.workReports);
        if (data.breakReports?.length) setBreakReports(data.breakReports);
        if (data.todos?.length) setTodos(data.todos);
      } catch (error) {
        console.error(error);
        setLoadError("保存済みデータの読み込みに失敗しました");
      }
    };

    load();
  }, []);

  const save = async () => {
    try {
      const res = await fetch("/api/work-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workReports, breakReports, todos }),
      });
      if (!res.ok) {
        throw new Error("保存に失敗しました");
      }
      setSaveError("");
      setMessage("保存しました");
      setTimeout(() => setMessage(""), 1500);
    } catch (error) {
      console.error(error);
      setSaveError("保存に失敗しました");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">作業報告</h1>
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded px-4 py-2 ${tab === "work" ? "bg-blue-600 text-white" : "border"}`}
          onClick={() => setTab("work")}
        >
          作業報告
        </button>
        <button
          type="button"
          className={`rounded px-4 py-2 ${tab === "break" ? "bg-blue-600 text-white" : "border"}`}
          onClick={() => setTab("break")}
        >
          休憩報告
        </button>
      </div>

      {tab === "work" ? (
        <div className="space-y-3">
          {workReports.map((report, index) => (
            <WorkReportForm
              key={`work-${index}`}
              report={report}
              onChange={(value) => {
                const next = [...workReports];
                next[index] = value;
                setWorkReports(next);
              }}
              onRemove={() => setWorkReports((prev) => prev.filter((_, i) => i !== index))}
              canRemove={workReports.length > 1}
            />
          ))}
          <button
            type="button"
            className="rounded border px-3 py-2"
            onClick={() => setWorkReports((prev) => [...prev, { ...defaultWork }])}
          >
            作業追加
          </button>

          <div className="space-y-2 rounded border bg-white p-4">
            <h2 className="font-semibold">次の日のTODO</h2>
            {todos.map((todo, index) => (
              <div key={`todo-${index}`} className="flex gap-2">
                <input
                  className="flex-1 rounded border px-3 py-2"
                  value={todo}
                  placeholder="TODO"
                  onChange={(e) => {
                    const next = [...todos];
                    next[index] = e.target.value;
                    setTodos(next);
                  }}
                />
                <button
                  type="button"
                  className="rounded border px-3 py-2"
                  onClick={() => setTodos((prev) => prev.filter((_, i) => i !== index))}
                  disabled={todos.length === 1}
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => setTodos((prev) => [...prev, ""])}
            >
              TODO追加
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {breakReports.map((report, index) => (
            <div key={`break-${index}`} className="grid grid-cols-1 gap-2 rounded border bg-white p-4 md:grid-cols-3">
              <input
                type="time"
                className="rounded border px-3 py-2"
                value={report.start_time}
                onChange={(e) => {
                  const next = [...breakReports];
                  next[index] = { ...report, start_time: e.target.value };
                  setBreakReports(next);
                }}
              />
              <input
                type="time"
                className="rounded border px-3 py-2"
                value={report.end_time}
                onChange={(e) => {
                  const next = [...breakReports];
                  next[index] = { ...report, end_time: e.target.value };
                  setBreakReports(next);
                }}
              />
              <button
                type="button"
                className="rounded border px-3 py-2"
                onClick={() => setBreakReports((prev) => prev.filter((_, i) => i !== index))}
                disabled={breakReports.length === 1}
              >
                休憩削除
              </button>
            </div>
          ))}
          <button
            type="button"
            className="rounded border px-3 py-2"
            onClick={() => setBreakReports((prev) => [...prev, { ...defaultBreak }])}
          >
            休憩追加
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" className="rounded bg-blue-600 px-4 py-2 text-white" onClick={save}>
          保存
        </button>
        <button
          type="button"
          className="rounded bg-green-600 px-4 py-2 text-white"
          onClick={() => router.push("/leave-report")}
        >
          退勤
        </button>
      </div>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
    </div>
  );
}

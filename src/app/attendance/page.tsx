"use client";

import { useEffect, useMemo, useState } from "react";
import CurrentDateTime from "@/components/CurrentDateTime";

type MonthlyRecord = {
  date: string;
  checkin_at: string | null;
  checkout_at: string | null;
  breaks: {
    start_time: string | null;
    end_time: string | null;
  }[];
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function formatMonth(date: Date): string {
  return `${date.getFullYear()}年${`${date.getMonth() + 1}`.padStart(2, "0")}月`;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return `${year}/${`${month}`.padStart(2, "0")}/${`${day}`.padStart(2, "0")} (${weekdays[date.getDay()]})`;
}

function formatDateTimeToHourMinute(value: string | null): string {
  if (!value) return "-";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  });
}

function formatBreakTime(value: string | null): string {
  const formatted = formatDateTimeToHourMinute(value);
  return formatted === "-" ? "--:--" : formatted;
}

export default function AttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const res = await fetch(`/api/attendance/monthly?year=${year}&month=${month}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("勤怠一覧の取得に失敗しました");
        }
        const data = await res.json();
        setRecords(data.records ?? []);
        setError("");
      } catch (fetchError) {
        console.error(fetchError);
        setError("勤怠一覧の読み込みに失敗しました");
      }
    };
    load();
  }, [currentMonth]);

  const recordMap = useMemo(() => new Map(records.map((record) => [record.date, record])), [records]);

  const dayKeys = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => toDateKey(new Date(year, month, index + 1)));
  }, [currentMonth]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">勤怠一覧</h1>
      <CurrentDateTime />
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="rounded border px-3 py-2"
          onClick={() =>
            setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
          }
        >
          &lt; 前月
        </button>
        <p className="font-semibold">{formatMonth(currentMonth)}</p>
        <button
          type="button"
          className="rounded border px-3 py-2"
          onClick={() =>
            setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
          }
        >
          次月 &gt;
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse border bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">日付</th>
              <th className="border px-3 py-2 text-left">出勤時間</th>
              <th className="border px-3 py-2 text-left">退勤時間</th>
              <th className="border px-3 py-2 text-left">休憩時間</th>
            </tr>
          </thead>
          <tbody>
            {dayKeys.map((dayKey) => {
              const record = recordMap.get(dayKey);
              const breakText =
                record?.breaks?.length
                  ? record.breaks
                      .map(
                        (breakRecord) =>
                          `${formatBreakTime(breakRecord.start_time)}〜${formatBreakTime(breakRecord.end_time)}`,
                      )
                      .join("\n")
                  : "-";

              return (
                <tr key={dayKey}>
                  <td className="border px-3 py-2">{formatDateLabel(dayKey)}</td>
                  <td className="border px-3 py-2">{formatDateTimeToHourMinute(record?.checkin_at ?? null)}</td>
                  <td className="border px-3 py-2">{formatDateTimeToHourMinute(record?.checkout_at ?? null)}</td>
                  <td className="border px-3 py-2 whitespace-pre-wrap">{breakText}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

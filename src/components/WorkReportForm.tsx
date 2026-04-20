"use client";

import type { WorkReportInput } from "@/lib/db";

type Props = {
  report: WorkReportInput;
  onChange: (value: WorkReportInput) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export default function WorkReportForm({ report, onChange, onRemove, canRemove }: Props) {
  return (
    <div className="space-y-2 rounded border bg-white p-4">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          開始時間
          <input
            type="time"
            className="mt-1 w-full rounded border px-2 py-1"
            value={report.start_time}
            onChange={(e) => onChange({ ...report, start_time: e.target.value })}
          />
        </label>
        <label className="text-sm">
          終了時間
          <input
            type="time"
            className="mt-1 w-full rounded border px-2 py-1"
            value={report.end_time}
            onChange={(e) => onChange({ ...report, end_time: e.target.value })}
          />
        </label>
      </div>
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="タイトル"
        value={report.title}
        onChange={(e) => onChange({ ...report, title: e.target.value })}
      />
      <textarea
        className="w-full rounded border px-3 py-2"
        placeholder="行ったことの内容"
        rows={3}
        value={report.content}
        onChange={(e) => onChange({ ...report, content: e.target.value })}
      />
      <textarea
        className="w-full rounded border px-3 py-2"
        placeholder="課題点"
        rows={2}
        value={report.issues}
        onChange={(e) => onChange({ ...report, issues: e.target.value })}
      />
      <select
        className="w-full rounded border px-3 py-2"
        value={report.evaluation}
        onChange={(e) =>
          onChange({ ...report, evaluation: e.target.value as WorkReportInput["evaluation"] })
        }
      >
        <option value="良好">良好</option>
        <option value="普通">普通</option>
        <option value="要改善">要改善</option>
      </select>
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="rounded border px-3 py-2"
      >
        作業削除
      </button>
    </div>
  );
}

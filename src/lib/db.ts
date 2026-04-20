import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type TemplateType = "checkin" | "checkout";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "kintai.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS template_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  checkin_at DATETIME,
  checkout_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendance_id INTEGER NOT NULL,
  start_time TEXT,
  end_time TEXT,
  title TEXT NOT NULL,
  content TEXT,
  issues TEXT,
  evaluation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (attendance_id) REFERENCES attendance(id)
);

CREATE TABLE IF NOT EXISTS break_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendance_id INTEGER NOT NULL,
  start_time TEXT,
  end_time TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (attendance_id) REFERENCES attendance(id)
);

CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendance_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (attendance_id) REFERENCES attendance(id)
);
`);

export type Template = {
  id: number;
  type: TemplateType;
  title: string;
  items: string[];
};

export type WorkReportInput = {
  start_time: string;
  end_time: string;
  title: string;
  content: string;
  issues: string;
  evaluation: "良好" | "普通" | "要改善";
};

export type BreakReportInput = {
  start_time: string;
  end_time: string;
};

export function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getOrCreateAttendance(date = getTodayDate()): number {
  const row = db
    .prepare("SELECT id FROM attendance WHERE date = ?")
    .get(date) as { id: number } | undefined;

  if (row) {
    return row.id;
  }

  const result = db.prepare("INSERT INTO attendance (date) VALUES (?)").run(date);
  return Number(result.lastInsertRowid);
}

export function getTemplates(type?: TemplateType): Template[] {
  const rows = (type
    ? db
        .prepare("SELECT id, type, title FROM templates WHERE type = ? ORDER BY updated_at DESC, id DESC")
        .all(type)
    : db.prepare("SELECT id, type, title FROM templates ORDER BY updated_at DESC, id DESC").all()) as {
    id: number;
    type: TemplateType;
    title: string;
  }[];

  const itemStmt = db
    .prepare("SELECT content FROM template_items WHERE template_id = ? ORDER BY order_index ASC, id ASC");

  return rows.map((row) => ({
    ...row,
    items: (itemStmt.all(row.id) as { content: string }[]).map((item) => item.content),
  }));
}

export function getLatestTemplate(type: TemplateType): Template | null {
  const template = getTemplates(type)[0];
  return template ?? null;
}

export function saveTemplate(params: {
  id?: number;
  type: TemplateType;
  title: string;
  items: string[];
}): Template {
  const cleanedItems = params.items
    .map((item) => item.trim())
    .filter((item): item is string => item.length > 0);

  if (params.id) {
    db.prepare("UPDATE templates SET type = ?, title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      params.type,
      params.title,
      params.id,
    );
    db.prepare("DELETE FROM template_items WHERE template_id = ?").run(params.id);

    const insertItem = db.prepare(
      "INSERT INTO template_items (template_id, content, order_index) VALUES (?, ?, ?)",
    );
    cleanedItems.forEach((content, index) => {
      insertItem.run(params.id, content, index);
    });

    return getTemplates().find((template) => template.id === params.id)!;
  }

  const result = db.prepare("INSERT INTO templates (type, title) VALUES (?, ?)").run(params.type, params.title);
  const templateId = Number(result.lastInsertRowid);

  const insertItem = db.prepare(
    "INSERT INTO template_items (template_id, content, order_index) VALUES (?, ?, ?)",
  );
  cleanedItems.forEach((content, index) => {
    insertItem.run(templateId, content, index);
  });

  return getTemplates().find((template) => template.id === templateId)!;
}

export function deleteTemplate(id: number): void {
  db.prepare("DELETE FROM templates WHERE id = ?").run(id);
}

export function setCheckin(date = getTodayDate()): { id: number; date: string } {
  const attendanceId = getOrCreateAttendance(date);
  db.prepare("UPDATE attendance SET checkin_at = CURRENT_TIMESTAMP WHERE id = ?").run(attendanceId);
  return { id: attendanceId, date };
}

export function setCheckout(date = getTodayDate()): { id: number; date: string } {
  const attendanceId = getOrCreateAttendance(date);
  db.prepare("UPDATE attendance SET checkout_at = CURRENT_TIMESTAMP WHERE id = ?").run(attendanceId);
  return { id: attendanceId, date };
}

export function getLatestTodosBeforeToday(today = getTodayDate()): string[] {
  const row = db
    .prepare("SELECT id FROM attendance WHERE date < ? ORDER BY date DESC, id DESC LIMIT 1")
    .get(today) as { id: number } | undefined;

  if (!row) {
    return [];
  }

  return (db
    .prepare("SELECT content FROM todos WHERE attendance_id = ? ORDER BY order_index ASC, id ASC")
    .all(row.id) as { content: string }[]).map((todo) => todo.content);
}

export function getWorkReportBundle(date = getTodayDate()): {
  attendanceId: number;
  workReports: WorkReportInput[];
  breakReports: BreakReportInput[];
  todos: string[];
} {
  const attendanceId = getOrCreateAttendance(date);

  const workReports = db
    .prepare(
      "SELECT start_time, end_time, title, content, issues, evaluation FROM work_reports WHERE attendance_id = ? ORDER BY order_index ASC, id ASC",
    )
    .all(attendanceId) as WorkReportInput[];

  const breakReports = db
    .prepare(
      "SELECT start_time, end_time FROM break_reports WHERE attendance_id = ? ORDER BY order_index ASC, id ASC",
    )
    .all(attendanceId) as BreakReportInput[];

  const todos = (db
    .prepare("SELECT content FROM todos WHERE attendance_id = ? ORDER BY order_index ASC, id ASC")
    .all(attendanceId) as { content: string }[]).map((todo) => todo.content);

  return {
    attendanceId,
    workReports,
    breakReports,
    todos,
  };
}

export function saveWorkReportBundle(params: {
  date?: string;
  workReports: WorkReportInput[];
  breakReports: BreakReportInput[];
  todos: string[];
}): { attendanceId: number } {
  const attendanceId = getOrCreateAttendance(params.date ?? getTodayDate());

  db.prepare("DELETE FROM work_reports WHERE attendance_id = ?").run(attendanceId);
  db.prepare("DELETE FROM break_reports WHERE attendance_id = ?").run(attendanceId);
  db.prepare("DELETE FROM todos WHERE attendance_id = ?").run(attendanceId);

  const insertWork = db.prepare(
    "INSERT INTO work_reports (attendance_id, start_time, end_time, title, content, issues, evaluation, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );

  params.workReports.forEach((report, index) => {
    if (!report.title.trim()) {
      return;
    }
    insertWork.run(
      attendanceId,
      report.start_time || null,
      report.end_time || null,
      report.title.trim(),
      report.content || null,
      report.issues || null,
      report.evaluation || "普通",
      index,
    );
  });

  const insertBreak = db.prepare(
    "INSERT INTO break_reports (attendance_id, start_time, end_time, order_index) VALUES (?, ?, ?, ?)",
  );

  params.breakReports.forEach((report, index) => {
    if (!report.start_time && !report.end_time) {
      return;
    }
    insertBreak.run(attendanceId, report.start_time || null, report.end_time || null, index);
  });

  const insertTodo = db.prepare(
    "INSERT INTO todos (attendance_id, content, order_index) VALUES (?, ?, ?)",
  );

  params.todos
    .map((todo) => todo.trim())
    .filter((todo) => todo.length > 0)
    .forEach((todo, index) => {
      insertTodo.run(attendanceId, todo, index);
    });

  return { attendanceId };
}

export function saveTodosForToday(todos: string[], date = getTodayDate()): { attendanceId: number } {
  const attendanceId = getOrCreateAttendance(date);
  db.prepare("DELETE FROM todos WHERE attendance_id = ?").run(attendanceId);

  const insertTodo = db.prepare(
    "INSERT INTO todos (attendance_id, content, order_index) VALUES (?, ?, ?)",
  );

  todos
    .map((todo) => todo.trim())
    .filter((todo) => todo.length > 0)
    .forEach((todo, index) => {
      insertTodo.run(attendanceId, todo, index);
    });

  return { attendanceId };
}

export default db;

"use client";

import { useEffect, useState } from "react";

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function formatNow(now: Date): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const date = `${now.getDate()}`.padStart(2, "0");
  const weekday = weekdayLabels[now.getDay()];
  const hour = `${now.getHours()}`.padStart(2, "0");
  const minute = `${now.getMinutes()}`.padStart(2, "0");
  const second = `${now.getSeconds()}`.padStart(2, "0");
  return `${year}年${month}月${date}日 (${weekday}) ${hour}:${minute}:${second}`;
}

export default function CurrentDateTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return null;

  return <p className="text-sm text-gray-600">{formatNow(now)}</p>;
}
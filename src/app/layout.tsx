import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "勤怠管理アプリ",
  description: "Slack用の勤怠報告テンプレートを作成する個人用アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-4xl gap-4 px-4 py-3">
            <Link href="/" className="text-blue-700 hover:underline">
              出勤
            </Link>
            <Link href="/work-report" className="text-blue-700 hover:underline">
              作業報告
            </Link>
            <Link href="/settings" className="text-blue-700 hover:underline">
              設定
            </Link>
            <Link href="/attendance" className="text-blue-700 hover:underline">
              勤怠一覧
            </Link>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

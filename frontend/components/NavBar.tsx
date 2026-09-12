"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === path
        ? "bg-brand-600 text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <span className="font-semibold text-gray-900">AI Trading Research Assistant</span>
        </Link>
        <nav className="flex gap-2">
          <Link href="/" className={linkClass("/")}>Research</Link>
          <Link href="/history" className={linkClass("/history")}>History</Link>
        </nav>
      </div>
    </header>
  );
}

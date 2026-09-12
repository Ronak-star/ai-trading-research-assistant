import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "AI Trading Research Assistant",
  description: "Ask a trading research question, clarify assumptions, and test it on sample data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-gray-900 antialiased">
        <NavBar />
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
        <footer className="max-w-5xl mx-auto px-6 py-10 text-xs text-gray-400 border-t border-gray-100 mt-10">
          Prototype for research purposes only. Results are based on simulated/sample data and
          do not constitute financial advice or guarantee future performance.
        </footer>
      </body>
    </html>
  );
}

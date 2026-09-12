"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, HistoryItem } from "@/lib/api";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getHistory()
      .then(setItems)
      .catch((e) => setError(e.message || "Failed to load history."));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Research History</h1>
      <p className="text-gray-500 mb-6 text-sm">All saved experiments and their results.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {items === null && !error && <p className="text-gray-400 text-sm">Loading...</p>}

      {items && items.length === 0 && (
        <div className="card p-10 text-center text-gray-400 text-sm">
          No experiments yet. Head to Research to ask your first question.
        </div>
      )}

      <div className="space-y-3">
        {items?.map((item) => (
          <Link
            key={item.experiment_id}
            href={`/experiments/${item.experiment_id}`}
            className="card p-5 flex items-center justify-between hover:border-brand-300 transition-colors block"
          >
            <div>
              <p className="font-medium text-gray-900">{item.raw_question}</p>
              <p className="text-xs text-gray-400 mt-1">
                {item.market} • {new Date(item.created_at).toLocaleString()} •{" "}
                <span className="capitalize">{item.status}</span>
              </p>
            </div>
            {item.key_metrics && (
              <div className="text-right text-sm shrink-0 ml-4">
                <p className={item.key_metrics.total_return_pct >= 0 ? "text-green-600" : "text-red-500"}>
                  {item.key_metrics.total_return_pct}% total
                </p>
                <p className="text-gray-400 text-xs">
                  {item.key_metrics.win_rate}% win · {item.key_metrics.total_trades} trades
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

const EXAMPLES = [
  "Does buying NIFTY after a 2% fall work better during high-volatility periods?",
  "Does buying NIFTY after a sharp fall work?",
  "Is there an edge in buying BANKNIFTY after a 3% single-day drop and holding for a week?",
];

export default function AskStep({
  onSubmit,
  loading,
}: {
  onSubmit: (question: string) => void;
  loading: boolean;
}) {
  const [question, setQuestion] = useState("");

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold mb-2">AI Trading Research Assistant</h1>
      <p className="text-gray-500 mb-6">
        Ask a natural-language trading research question. We&apos;ll extract what you said,
        ask about anything important that&apos;s missing, then run a small test on sample
        market data so you can see what the data actually shows.
      </p>

      <textarea
        className="w-full border border-gray-300 rounded-lg p-4 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[120px]"
        placeholder="e.g. Does buying NIFTY after a sharp fall work?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="flex flex-wrap gap-2 mt-3">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuestion(ex)}
            className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      <button
        disabled={!question.trim() || loading}
        onClick={() => onSubmit(question.trim())}
        className="mt-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
    </div>
  );
}

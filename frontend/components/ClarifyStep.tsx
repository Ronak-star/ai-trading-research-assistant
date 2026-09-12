"use client";

import { useState } from "react";
import { AnalyzeResponse } from "@/lib/api";

export default function ClarifyStep({
  analysis,
  onSubmit,
  loading,
}: {
  analysis: AnalyzeResponse;
  onSubmit: (answers: { field: string; value: string }[]) => void;
  loading: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const understood: [string, string][] = [];
  const { extracted } = analysis;
  if (extracted.instrument) understood.push(["Instrument", extracted.instrument]);
  if (extracted.market) understood.push(["Market", extracted.market]);
  if (extracted.entry_condition) understood.push(["Entry condition", extracted.entry_condition]);
  if (extracted.holding_period) understood.push(["Holding period", extracted.holding_period]);
  if (extracted.test_period) understood.push(["Test period", extracted.test_period]);
  if (extracted.filters.length) understood.push(["Filters", extracted.filters.join(", ")]);

  const allAnswered = analysis.missing_fields.every((m) => answers[m.field]?.trim());

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3 tracking-wide">I UNDERSTAND</h2>
        {understood.length === 0 ? (
          <p className="text-gray-400 text-sm">No specific details were clearly stated yet.</p>
        ) : (
          <ul className="space-y-2">
            {understood.map(([label, value]) => (
              <li key={label} className="flex gap-2 text-sm">
                <span className="text-green-600">✓</span>
                <span className="text-gray-600">{label}:</span>
                <span className="font-medium">{value}</span>
              </li>
            ))}
          </ul>
        )}
        {extracted.explicit_statements.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">What you said, verbatim intent:</p>
            <ul className="text-xs text-gray-500 space-y-1">
              {extracted.explicit_statements.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {analysis.missing_fields.length > 0 && (
        <div className="card p-6 border-amber-200 bg-amber-50/40">
          <h2 className="text-sm font-semibold text-amber-700 mb-3 tracking-wide">
            MISSING — PLEASE CLARIFY
          </h2>
          <div className="space-y-4">
            {analysis.missing_fields.map((m) => (
              <div key={m.field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {m.prompt}
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Type your answer..."
                  value={answers[m.field] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [m.field]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-700 mt-4">
            We never silently invent important trading parameters — your answers here become
            explicit, user-provided facts.
          </p>
        </div>
      )}

      <button
        disabled={!allAnswered || loading}
        onClick={() =>
          onSubmit(Object.entries(answers).map(([field, value]) => ({ field, value })))
        }
        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        {loading ? "Saving..." : "Continue to Experiment Definition"}
      </button>
    </div>
  );
}

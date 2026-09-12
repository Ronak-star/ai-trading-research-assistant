"use client";

import { useState } from "react";
import { ExperimentCreate } from "@/lib/api";

const INSTRUMENTS = ["NIFTY", "BANKNIFTY", "SENSEX"];

export default function DefineStep({
  initial,
  onSubmit,
  loading,
  errors,
}: {
  initial: ExperimentCreate;
  onSubmit: (exp: ExperimentCreate) => void;
  loading: boolean;
  errors: string[];
}) {
  const [exp, setExp] = useState<ExperimentCreate>(initial);

  const update = <K extends keyof ExperimentCreate>(key: K, value: ExperimentCreate[K]) =>
    setExp((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="card p-8 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Experiment Definition</h2>
        <p className="text-sm text-gray-500">
          Review and edit before running the test. Anything not explicitly stated by you is
          marked as an assumption below.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <p className="font-medium mb-1">Please fix the following:</p>
          <ul className="list-disc list-inside">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Market / Instrument">
          <select
            className="input"
            value={exp.market}
            onChange={(e) => update("market", e.target.value)}
          >
            {INSTRUMENTS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </Field>
        <Field label="Timeframe">
          <input className="input" value={exp.timeframe} onChange={(e) => update("timeframe", e.target.value)} />
        </Field>
      </div>

      <Field label="Condition (entry trigger)">
        <input className="input" value={exp.condition} onChange={(e) => update("condition", e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Entry rule">
          <input className="input" value={exp.entry_rule} onChange={(e) => update("entry_rule", e.target.value)} />
        </Field>
        <Field label="Exit rule">
          <input className="input" value={exp.exit_rule} onChange={(e) => update("exit_rule", e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Holding period (days)">
          <input
            type="number"
            className="input"
            value={exp.holding_period_days}
            onChange={(e) => update("holding_period_days", parseInt(e.target.value || "0", 10))}
          />
        </Field>
        <Field label="Test period start">
          <input
            type="date"
            className="input"
            value={exp.test_period_start}
            onChange={(e) => update("test_period_start", e.target.value)}
          />
        </Field>
        <Field label="Test period end">
          <input
            type="date"
            className="input"
            value={exp.test_period_end}
            onChange={(e) => update("test_period_end", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Transaction cost (%)">
          <input
            type="number"
            step="0.01"
            className="input"
            value={exp.transaction_cost_pct}
            onChange={(e) => update("transaction_cost_pct", parseFloat(e.target.value || "0"))}
          />
        </Field>
        <Field label="Slippage (%)">
          <input
            type="number"
            step="0.01"
            className="input"
            value={exp.slippage_pct}
            onChange={(e) => update("slippage_pct", parseFloat(e.target.value || "0"))}
          />
        </Field>
      </div>

      <Field label="Hypothesis">
        <textarea
          className="input min-h-[70px]"
          value={exp.hypothesis}
          onChange={(e) => update("hypothesis", e.target.value)}
        />
      </Field>

      {exp.assumptions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-700 mb-2 tracking-wide">
            SYSTEM ASSUMPTIONS (not stated by you)
          </p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            {exp.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        disabled={loading}
        onClick={() => onSubmit(exp)}
        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        {loading ? "Validating..." : "Validate & Run Test"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #3b7dd8;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

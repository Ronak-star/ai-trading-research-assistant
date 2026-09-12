"use client";

import { useEffect, useState } from "react";
import { api, ExperimentOut, ExperimentResultOut } from "@/lib/api";
import ResultsDashboard from "@/components/ResultsDashboard";

export default function ExperimentDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  const [experiment, setExperiment] = useState<ExperimentOut | null>(null);
  const [result, setResult] = useState<ExperimentResultOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getExperiment(id).then(setExperiment).catch((e) => setError(e.message));
    api.getResult(id).then(setResult).catch(() => {});
  }, [id]);

  if (error) {
    return <div className="text-red-600 text-sm">{error}</div>;
  }
  if (!experiment) {
    return <p className="text-gray-400 text-sm">Loading...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6">
        <h1 className="text-lg font-semibold mb-4">{experiment.hypothesis}</h1>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Row label="Market" value={experiment.market} />
          <Row label="Timeframe" value={experiment.timeframe} />
          <Row label="Condition" value={experiment.condition} />
          <Row label="Holding period" value={`${experiment.holding_period_days} days`} />
          <Row label="Test period" value={`${experiment.test_period_start} → ${experiment.test_period_end}`} />
          <Row label="Cost / Slippage" value={`${experiment.transaction_cost_pct}% / ${experiment.slippage_pct}%`} />
        </div>
        {experiment.assumptions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 mb-1">ASSUMPTIONS</p>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
              {experiment.assumptions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
        )}
      </div>

      {result ? (
        <ResultsDashboard result={result} />
      ) : (
        <p className="text-gray-400 text-sm">No test result saved for this experiment yet.</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}

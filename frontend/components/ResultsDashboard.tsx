"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ExperimentResultOut } from "@/lib/api";

export default function ResultsDashboard({ result }: { result: ExperimentResultOut }) {
  return (
    <div className="space-y-6">
      {result.is_simulated && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2 rounded-lg font-medium">
          ⚠ SIMULATED / SAMPLE DATA — not real historical market evidence.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Metric label="Total Trades" value={result.total_trades} />
        <Metric label="Win Rate" value={`${result.win_rate}%`} />
        <Metric label="Avg Return" value={`${result.average_return_pct}%`} />
        <Metric
          label="Total Return"
          value={`${result.total_return_pct}%`}
          positive={result.total_return_pct >= 0}
        />
        <Metric label="Max Drawdown" value={`${result.max_drawdown_pct}%`} negative />
      </div>

      {result.equity_curve.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 tracking-wide">EQUITY CURVE (simulated)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={result.equity_curve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={30} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="equity" stroke="#3b7dd8" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-2 tracking-wide">WHAT THE DATA SHOWS</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{result.data_summary}</p>
      </div>

      <div className="card p-6 bg-blue-50/50 border-blue-100">
        <h3 className="text-sm font-semibold text-blue-700 mb-2 tracking-wide">WHAT WE CAN REASONABLY CONCLUDE</h3>
        <p className="text-sm text-blue-900 leading-relaxed">{result.ai_conclusion}</p>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-3 tracking-wide">WHAT WE SHOULD INVESTIGATE NEXT</h3>
        <ul className="space-y-2">
          {result.next_questions.map((q, i) => (
            <li key={i} className="text-sm text-gray-700 flex gap-2">
              <span className="text-brand-600">→</span>
              {q}
            </li>
          ))}
        </ul>
      </div>

      <details className="card p-6">
        <summary className="text-sm font-semibold text-gray-500 cursor-pointer">
          Trade log ({result.trades.length} trades)
        </summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="py-1 pr-4">Entry</th>
                <th className="py-1 pr-4">Exit</th>
                <th className="py-1 pr-4">Entry Px</th>
                <th className="py-1 pr-4">Exit Px</th>
                <th className="py-1 pr-4">Return</th>
                <th className="py-1">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {result.trades.map((t, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-1 pr-4">{t.entry_date}</td>
                  <td className="py-1 pr-4">{t.exit_date}</td>
                  <td className="py-1 pr-4">{t.entry_price}</td>
                  <td className="py-1 pr-4">{t.exit_price}</td>
                  <td className={`py-1 pr-4 ${t.return_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {t.return_pct}%
                  </td>
                  <td className="py-1 capitalize">{t.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Metric({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string | number;
  positive?: boolean;
  negative?: boolean;
}) {
  const color = positive ? "text-green-600" : negative ? "text-red-500" : "text-gray-900";
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}

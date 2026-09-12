const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ? JSON.stringify(body.detail) : detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// ---- Types ----

export interface ExtractedFacts {
  instrument: string | null;
  market: string | null;
  timeframe: string | null;
  entry_condition: string | null;
  exit_condition: string | null;
  holding_period: string | null;
  test_period: string | null;
  filters: string[];
  hypothesis: string | null;
  explicit_statements: string[];
}

export interface MissingField {
  field: string;
  prompt: string;
}

export interface AnalyzeResponse {
  research_question_id: number;
  raw_question: string;
  extracted: ExtractedFacts;
  missing_fields: MissingField[];
  needs_clarification: boolean;
}

export interface ClarifyResponse {
  research_question_id: number;
  merged_facts: ExtractedFacts;
  status: string;
}

export interface ExperimentCreate {
  research_question_id: number;
  market: string;
  timeframe: string;
  condition: string;
  entry_rule: string;
  exit_rule: string;
  holding_period_days: number;
  test_period_start: string;
  test_period_end: string;
  filters: string[];
  transaction_cost_pct: number;
  slippage_pct: number;
  hypothesis: string;
  assumptions: string[];
}

export interface ExperimentOut extends ExperimentCreate {
  id: number;
  status: string;
}

export interface Trade {
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  return_pct: number;
  outcome: "win" | "loss";
}

export interface ExperimentResultOut {
  experiment_id: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  average_return_pct: number;
  total_return_pct: number;
  max_drawdown_pct: number;
  equity_curve: { date: string; equity: number }[];
  trades: Trade[];
  data_summary: string;
  ai_conclusion: string;
  next_questions: string[];
  is_simulated: boolean;
}

export interface HistoryItem {
  experiment_id: number;
  research_question_id: number;
  raw_question: string;
  status: string;
  created_at: string;
  market: string;
  key_metrics: { win_rate: number; total_return_pct: number; total_trades: number } | null;
}

// ---- API calls ----

export const api = {
  analyze: (question: string) =>
    request<AnalyzeResponse>("/api/research/analyze", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),

  clarify: (research_question_id: number, answers: { field: string; value: string }[]) =>
    request<ClarifyResponse>("/api/research/clarify", {
      method: "POST",
      body: JSON.stringify({ research_question_id, answers }),
    }),

  createExperiment: (exp: ExperimentCreate) =>
    request<ExperimentOut>("/api/research/experiments", {
      method: "POST",
      body: JSON.stringify(exp),
    }),

  runTest: (experimentId: number) =>
    request<ExperimentResultOut>(`/api/research/experiments/${experimentId}/test`, {
      method: "POST",
    }),

  getExperiment: (experimentId: number) =>
    request<ExperimentOut>(`/api/research/experiments/${experimentId}`),

  getResult: (experimentId: number) =>
    request<ExperimentResultOut>(`/api/research/experiments/${experimentId}/result`),

  getHistory: () => request<HistoryItem[]>("/api/research/history"),
};

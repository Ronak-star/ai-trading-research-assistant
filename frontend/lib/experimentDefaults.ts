import { ExtractedFacts, ExperimentCreate } from "@/lib/api";

function parseHoldingDays(holdingPeriod: string | null): number {
  if (!holdingPeriod) return 5;
  const m = holdingPeriod.match(/(\d+)\s*(day|week)/i);
  if (!m) return 5;
  const n = parseInt(m[1], 10);
  return m[2].toLowerCase().includes("week") ? n * 7 : n;
}

function parseTestPeriod(testPeriod: string | null): [string, string] {
  if (!testPeriod) return ["2016-01-01", "2026-01-01"];
  const m = testPeriod.match(/(\d{4}).*?(\d{4}|present)/);
  if (m) {
    const start = `${m[1]}-01-01`;
    const end = m[2] === "present" ? "2026-01-01" : `${m[2]}-01-01`;
    return [start, end];
  }
  return ["2016-01-01", "2026-01-01"];
}

export function buildDefaultExperiment(
  researchQuestionId: number,
  facts: ExtractedFacts
): ExperimentCreate {
  const assumptions: string[] = [];

  const entryRule = facts.entry_condition || "Daily fall >= 2%";
  if (!facts.entry_condition) {
    assumptions.push("Assumed default entry condition: daily fall >= 2% (not stated by user)");
  }

  const holdingDays = parseHoldingDays(facts.holding_period);
  if (!facts.holding_period) {
    assumptions.push("Assumed default holding period: 5 trading days (not stated by user)");
  }

  const [start, end] = parseTestPeriod(facts.test_period);
  if (!facts.test_period) {
    assumptions.push("Assumed default test period: 2016-2026 (not stated by user)");
  }

  assumptions.push("Assumed transaction cost: 0.10% per trade (industry-typical estimate)");
  assumptions.push("Assumed slippage: 0.05% per trade (industry-typical estimate)");

  return {
    research_question_id: researchQuestionId,
    market: facts.instrument || "NIFTY",
    timeframe: facts.timeframe || "Daily",
    condition: entryRule,
    entry_rule: `Buy at next session open when: ${entryRule}`,
    exit_rule: `Exit after ${holdingDays} trading days`,
    holding_period_days: holdingDays,
    test_period_start: start,
    test_period_end: end,
    filters: facts.filters,
    transaction_cost_pct: 0.1,
    slippage_pct: 0.05,
    hypothesis: facts.hypothesis || "Buying after a decline may produce a short-term edge.",
    assumptions,
  };
}

# Thinking Note

## 1. How the vague question is interpreted

"Does buying NIFTY after a sharp fall work?" is treated as a **signal of intent**, not a
complete spec. The parser extracts what's literally there (instrument = NIFTY, a vague
directional idea = "buy after a fall") and refuses to invent the rest. "Sharp fall" is a red
flag word — it implies a threshold exists in the user's head, but wasn't stated, so it must be
asked rather than guessed at (e.g. defaulting silently to 2% could produce a completely
different, misleading result than the user's actual mental model of "sharp").

## 2. What is explicitly stated

- Instrument: NIFTY (explicit).
- Direction/strategy shape: buy after a decline (explicit, but qualitative).
- Everything else (threshold, holding period, exit rule, test period) is absent.

## 3. What is assumed (and only after clarification is declined/skipped)

If the user does not supply a threshold, holding period, or test window, the Experiment
Builder applies conservative, clearly-labeled defaults (2% fall, 5-day hold, 2016–2026,
0.10% cost, 0.05% slippage) and tags each one as an assumption in the UI. These defaults are
never silently absorbed into "what the user said" — they render in a visually distinct
"assumptions" block on the Define screen and are stored separately in the DB
(`assumptions_json`) from the user-supplied facts.

## 4. What should be asked

Prioritized by how much they change the result: (1) entry threshold, since a 1% vs 5% fall
produces very different trade counts and edges; (2) holding period, since exit timing is often
the single biggest driver of a mean-reversion strategy's apparent edge; (3) test period, since
regime (2016–2019 vs 2020–2022 vs 2023–2026) matters a lot for a fall/rally strategy.

## 5. Experiment design

The experiment is deliberately simple: single-instrument, single-position (no overlapping
trades), enter at close on the signal day, exit N trading days later at close, apply a flat
cost+slippage drag once per round-trip. This keeps the demo explainable in under 3 minutes
while still surfacing the metrics that matter (win rate, average/total return, max drawdown)
and while explicitly avoiding a claim of production-grade accuracy.

## 6. Potential failure modes

- A too-loose entry threshold produces hundreds of trades that dilute any real signal.
- Non-overlapping trade selection understates how a real portfolio would behave if it could
  hold multiple concurrent positions.
- Cost/slippage assumptions, if wrong, can flip a marginal edge from positive to negative (or
  vice versa) — which is exactly why the "next question" generator always asks about cost
  sensitivity.
- Small trade counts (some test windows may only produce 5–15 signals) inflate variance in
  win rate; the AI Conclusion step explicitly flags this rather than treating 60% win rate on 8
  trades the same as 60% on 300 trades.
- Synthetic data cannot reproduce real market microstructure (e.g. actual volatility clustering,
  real crash dynamics) — the "shock injection" in data generation is a rough approximation only.

## 7. Why these technical/product decisions were made

- **Strict JSON everywhere, never free-form AI text for logic**: the whole point of the product
  is trustworthy separation of fact vs. interpretation; if the AI's raw prose were parsed for
  control flow, that boundary would leak and the "never invent parameters" guarantee would be
  unenforceable.
- **Mock AI mode as default**: makes the app runnable and demoable with zero external
  dependencies or API keys, and makes the rule-based fallback logic itself a legitimate,
  auditable implementation of "never invent critical information" (a human can read exactly
  what triggers each extraction/default).
- **Modular service pipeline**: mirrors the required architecture diagram directly, so each
  arrow in the spec maps to one Python file — easy to explain, easy to replace piece by piece
  (e.g. swap `mock_test_engine.py` for a real backtester later without touching the rest).
- **SQLite-by-default, Postgres-ready**: satisfies the "PostgreSQL" requirement for production
  use while not blocking a grader/reviewer without a local Postgres instance from running the
  demo immediately.

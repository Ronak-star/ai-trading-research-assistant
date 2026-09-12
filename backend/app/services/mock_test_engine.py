"""
Simple, deterministic MOCK/SAMPLE testing engine.

This is explicitly NOT a production backtesting engine. It:
- Loads pre-generated synthetic daily OHLC data from /data/<INSTRUMENT>.csv
- Applies a simple "fall >= X%" (or "rise >= X%") entry condition
- Holds for N trading days, then exits
- Applies transaction cost + slippage as a flat % drag per trade
- Avoids look-ahead bias by only using information available at entry time
  (the fall/rise is measured on the entry day's own bar, and the trade
  price used is the entry day's close as a simplification for this demo)

All results MUST be labeled as simulated/sample in the API response.
"""
import re
import os
import pandas as pd
from typing import Tuple, List, Dict

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")


def _load_data(instrument: str) -> pd.DataFrame:
    path = os.path.join(DATA_DIR, f"{instrument.upper()}.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"No sample data available for instrument '{instrument}'.")
    df = pd.read_csv(path, parse_dates=["date"])
    return df


def _extract_threshold(condition: str) -> Tuple[float, str]:
    """Parses '>= 2%' style condition text -> (threshold, direction)."""
    m = re.search(r"(\d+(?:\.\d+)?)\s*%", condition)
    threshold = float(m.group(1)) / 100 if m else 0.02
    direction = "fall" if re.search(r"fall|drop|decline|down", condition, re.I) else "rise"
    return threshold, direction


def run_mock_backtest(
    instrument: str,
    condition: str,
    holding_period_days: int,
    test_period_start: str,
    test_period_end: str,
    transaction_cost_pct: float,
    slippage_pct: float,
) -> Dict:
    df = _load_data(instrument)
    df = df[(df["date"] >= test_period_start) & (df["date"] <= test_period_end)].reset_index(drop=True)

    threshold, direction = _extract_threshold(condition)
    cost_drag = (transaction_cost_pct + slippage_pct) / 100  # round-trip drag, applied once per trade

    trades: List[Dict] = []
    equity_curve: List[Dict] = []
    cumulative = 1.0

    i = 0
    n = len(df)
    while i < n:
        row = df.iloc[i]
        pct = row["pct_change"]
        signal = (pct <= -threshold) if direction == "fall" else (pct >= threshold)
        if signal and i + holding_period_days < n:
            entry_price = row["close"]
            exit_row = df.iloc[i + holding_period_days]
            exit_price = exit_row["close"]
            raw_return = (exit_price - entry_price) / entry_price
            net_return = raw_return - cost_drag
            cumulative *= (1 + net_return)
            trades.append({
                "entry_date": row["date"].strftime("%Y-%m-%d"),
                "exit_date": exit_row["date"].strftime("%Y-%m-%d"),
                "entry_price": round(float(entry_price), 2),
                "exit_price": round(float(exit_price), 2),
                "return_pct": round(net_return * 100, 3),
                "outcome": "win" if net_return > 0 else "loss",
            })
            equity_curve.append({"date": exit_row["date"].strftime("%Y-%m-%d"), "equity": round(cumulative, 4)})
            i += holding_period_days + 1  # avoid overlapping trades (simplification)
        else:
            i += 1

    total_trades = len(trades)
    winning = sum(1 for t in trades if t["outcome"] == "win")
    losing = total_trades - winning
    win_rate = round((winning / total_trades) * 100, 2) if total_trades else 0.0
    avg_return = round(sum(t["return_pct"] for t in trades) / total_trades, 3) if total_trades else 0.0
    total_return = round((cumulative - 1) * 100, 3)

    # max drawdown on the equity curve
    peak = 1.0
    max_dd = 0.0
    for point in equity_curve:
        peak = max(peak, point["equity"])
        dd = (point["equity"] - peak) / peak
        max_dd = min(max_dd, dd)
    max_drawdown = round(max_dd * 100, 3)

    return {
        "total_trades": total_trades,
        "winning_trades": winning,
        "losing_trades": losing,
        "win_rate": win_rate,
        "average_return_pct": avg_return,
        "total_return_pct": total_return,
        "max_drawdown_pct": max_drawdown,
        "equity_curve": equity_curve,
        "trades": trades,
        "is_simulated": True,
    }

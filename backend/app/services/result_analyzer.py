import json
from app.config import settings
from app.services.ai_client import call_ai_json
from app.services.prompts import RESULT_ANALYZER_SYSTEM


def _mock_analyze(metrics: dict, hypothesis: str) -> dict:
    data_summary = (
        f"Across {metrics['total_trades']} simulated trades on sample data, "
        f"{metrics['winning_trades']} were winners and {metrics['losing_trades']} were losers "
        f"({metrics['win_rate']}% win rate). Average return per trade was "
        f"{metrics['average_return_pct']}%, cumulative return over the test period was "
        f"{metrics['total_return_pct']}%, and maximum drawdown was {metrics['max_drawdown_pct']}%."
    )

    if metrics["total_trades"] < 20:
        sample_note = "The sample size is small, so these results carry high uncertainty."
    else:
        sample_note = "The sample size is moderate, but results should still be treated cautiously."

    direction = "a positive" if metrics["total_return_pct"] > 0 else "a negative or unclear"
    ai_conclusion = (
        f"Based on SIMULATED/SAMPLE data only, the tested rule shows {direction} historical edge "
        f"under these specific assumptions (holding period, cost, and threshold as defined). "
        f"{sample_note} This does not confirm the hypothesis (\"{hypothesis}\") in general, "
        f"and past simulated performance does not guarantee future results. Overfitting, "
        f"regime change, and data quality are all open risks that have not been ruled out."
    )
    return {"data_summary": data_summary, "ai_conclusion": ai_conclusion}


def analyze_result(metrics: dict, hypothesis: str) -> dict:
    if settings.AI_PROVIDER == "openai":
        payload = json.dumps({"metrics": metrics, "hypothesis": hypothesis})
        result = call_ai_json(RESULT_ANALYZER_SYSTEM, payload)
        if result and "__error__" not in result and "data_summary" in result:
            return result
    return _mock_analyze(metrics, hypothesis)

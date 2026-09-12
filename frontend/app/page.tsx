"use client";

import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import AskStep from "@/components/AskStep";
import ClarifyStep from "@/components/ClarifyStep";
import DefineStep from "@/components/DefineStep";
import ResultsDashboard from "@/components/ResultsDashboard";
import { api, AnalyzeResponse, ExperimentCreate, ExperimentResultOut } from "@/lib/api";
import { buildDefaultExperiment } from "@/lib/experimentDefaults";

type FlowStep = "ask" | "clarify" | "define" | "test" | "learn";

export default function ResearchPage() {
  const [step, setStep] = useState<FlowStep>("ask");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [experimentDraft, setExperimentDraft] = useState<ExperimentCreate | null>(null);
  const [experimentId, setExperimentId] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ExperimentResultOut | null>(null);

  const stepIndex = { ask: 0, clarify: 1, define: 2, test: 3, learn: 4 }[step];

  async function handleAsk(question: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyze(question);
      setAnalysis(res);
      if (res.needs_clarification) {
        setStep("clarify");
      } else {
        setExperimentDraft(buildDefaultExperiment(res.research_question_id, res.extracted));
        setStep("define");
      }
    } catch (e: any) {
      setError(e.message || "Failed to analyze question.");
    } finally {
      setLoading(false);
    }
  }

  async function handleClarify(answers: { field: string; value: string }[]) {
    if (!analysis) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.clarify(analysis.research_question_id, answers);
      setExperimentDraft(buildDefaultExperiment(res.research_question_id, res.merged_facts));
      setStep("define");
    } catch (e: any) {
      setError(e.message || "Failed to save clarifications.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDefine(exp: ExperimentCreate) {
    setLoading(true);
    setError(null);
    setValidationErrors([]);
    try {
      const created = await api.createExperiment(exp);
      setExperimentId(created.id);
      setStep("test");
      const res = await api.runTest(created.id);
      setResult(res);
      setStep("learn");
    } catch (e: any) {
      try {
        const parsed = JSON.parse(e.message);
        setValidationErrors(parsed.map((p: any) => p.message));
      } catch {
        setError(e.message || "Failed to create or run experiment.");
      }
      setStep("define");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("ask");
    setAnalysis(null);
    setExperimentDraft(null);
    setExperimentId(null);
    setResult(null);
    setError(null);
    setValidationErrors([]);
  }

  return (
    <div>
      <StepIndicator current={stepIndex} />

      {error && (
        <div className="max-w-2xl mx-auto mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {step === "ask" && <AskStep onSubmit={handleAsk} loading={loading} />}

        {step === "clarify" && analysis && (
          <ClarifyStep analysis={analysis} onSubmit={handleClarify} loading={loading} />
        )}

        {step === "define" && experimentDraft && (
          <DefineStep
            initial={experimentDraft}
            onSubmit={handleDefine}
            loading={loading}
            errors={validationErrors}
          />
        )}

        {step === "test" && (
          <div className="card p-10 text-center">
            <div className="animate-pulse text-brand-600 font-medium">
              Running test on sample market data...
            </div>
          </div>
        )}
      </div>

      {step === "learn" && result && (
        <div className="max-w-3xl mx-auto">
          <ResultsDashboard result={result} />
          <div className="mt-6 flex justify-center">
            <button
              onClick={reset}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              ← Start a new research question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

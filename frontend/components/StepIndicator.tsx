const STEPS = ["ASK", "CLARIFY", "DEFINE", "TEST", "LEARN"];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto">
      {STEPS.map((step, idx) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                idx < current
                  ? "bg-brand-600 border-brand-600 text-white"
                  : idx === current
                  ? "border-brand-600 text-brand-600 bg-brand-50"
                  : "border-gray-300 text-gray-400"
              }`}
            >
              {idx + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                idx <= current ? "text-brand-700" : "text-gray-400"
              }`}
            >
              {step}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${
                idx < current ? "bg-brand-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

const STARTER_QUESTIONS = [
  "What are the bond requirements for a title agent?",
  "How do I calculate the premium rate for a residential owner's policy?",
  "What are the escrow officer licensing requirements?",
  "What forms do I need for a standard residential closing?",
];

export function StarterQuestions({
  onSelect,
}: {
  onSelect: (question: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-8 px-4 py-16">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-[#1C1917] tracking-tight mb-2">
          Ask about the Basic Manual
        </h2>
        <p className="text-[13px] text-[#A8A29E] leading-relaxed">
          Get answers with specific statute and rule citations from the TDI
          Basic Manual
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
        {STARTER_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => onSelect(question)}
            className="text-left px-4 py-3.5 rounded-xl bg-white border border-[#E7E5E4] shadow-[0_1px_2px_0_rgb(0_0_0/0.03)] hover:shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] hover:border-[#D6D3D1] transition-all duration-200 text-[13px] text-[#44403C] leading-relaxed active:scale-[0.98]"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

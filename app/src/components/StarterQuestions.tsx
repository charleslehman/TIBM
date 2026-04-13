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
    <div className="flex flex-col items-center gap-6 px-4 py-12">
      <div className="text-center max-w-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Ask about the Texas Title Insurance Basic Manual
        </h2>
        <p className="text-sm text-gray-500">
          Get answers with specific statute and rule citations
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {STARTER_QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => onSelect(question)}
            className="text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-sm text-gray-700 leading-relaxed"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">About</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Texas Title Insurance Manual Assistant
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            Back to chat
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <article className="prose prose-sm prose-gray max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What is this tool?
          </h2>

          <p>
            The Texas Title Insurance Manual Assistant is an AI-powered reference
            tool built on top of the{" "}
            <a
              href="https://www.tdi.texas.gov/title/titleman.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Texas Department of Insurance Basic Manual of Title Insurance
            </a>
            . It lets title insurance professionals ask plain-English questions
            about statutes, rate rules, procedural rules, forms, and
            administrative requirements — and get back accurate, cited answers in
            seconds.
          </p>

          <p>
            Instead of searching through hundreds of pages across eight manual
            sections, you type your question and the assistant finds the relevant
            statute sections, rules, and form references for you. Every answer
            includes specific citations so you can verify the source material
            yourself.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            How it works
          </h3>

          <p>
            The tool is built on a technique called Retrieval-Augmented
            Generation (RAG). Here is what happens when you ask a question:
          </p>

          <ol className="list-decimal pl-6 space-y-2 my-4">
            <li>
              Your question is converted into a mathematical representation
              (called an embedding) that captures its meaning.
            </li>
            <li>
              That embedding is compared against our database of nearly 1,000
              content chunks drawn from every section of the Basic Manual —
              including the full text of Texas Insurance Code Title 11 (Chapters
              2501–2751), all rate rules, procedural rules, administrative rules,
              claims procedures, and the text of over 60 official TDI forms.
            </li>
            <li>
              The most relevant chunks are retrieved and passed to Claude, an AI
              model by Anthropic, along with your question.
            </li>
            <li>
              Claude generates an answer grounded in that specific context, with
              citations pointing back to the exact statutes, rules, and forms.
            </li>
          </ol>

          <p>
            This approach means the assistant only answers from actual manual
            content — it does not make things up. If the answer is not in the
            manual, it will tell you.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            What is covered
          </h3>

          <ul className="list-disc pl-6 space-y-1 my-4">
            <li>
              <strong>Texas Insurance Code Title 11</strong> — Chapters 2501
              through 2751, covering general provisions, prohibited conduct,
              title insurance companies, the guaranty association, agents and
              direct operations, escrow officers, closing and settlement, policy
              forms and premium rates, and personal property title insurance.
            </li>
            <li>
              <strong>Rate Rules (R-1 through R-36)</strong> — Premium rate
              schedules, owner&apos;s and mortgagee policy rates, simultaneous
              issuance, endorsement premiums, and special situations.
            </li>
            <li>
              <strong>Procedural Rules (P-1 through P-73)</strong> —
              Definitions, commitment procedures, endorsements, disbursement,
              division of premiums, closing disclosure, and licensing
              requirements.
            </li>
            <li>
              <strong>Administrative Rules</strong> — Agent and escrow officer
              licensing, minimum capitalization, surety bonds, audit
              requirements.
            </li>
            <li>
              <strong>Official Forms</strong> — Over 60 TDI forms including
              owner&apos;s and loan policies, endorsements, commitments, closing
              statements, and business forms.
            </li>
            <li>
              <strong>Claims Handling</strong> — Claims principles, procedures,
              and proof of loss requirements.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            Important limitations
          </h3>

          <p>
            This tool provides general reference information from the TDI Basic
            Manual. It is <strong>not legal advice</strong> and should not be
            relied upon as a substitute for professional guidance. Always consult
            your underwriter or legal counsel for specific transactions or
            coverage questions.
          </p>

          <p>
            The content is sourced from the publicly available Basic Manual at{" "}
            <a
              href="https://www.tdi.texas.gov/title/titleman.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              tdi.texas.gov
            </a>
            . While we work to keep the data current, the official TDI website
            is always the authoritative source for the most up-to-date rules and
            forms.
          </p>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              Built by{" "}
              <a
                href="https://taptx.space"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:underline"
              >
                TAP
              </a>
              {" "}for the Texas title insurance community.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

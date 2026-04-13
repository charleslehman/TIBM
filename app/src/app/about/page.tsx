import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-[#FAFAF9]">
      <header className="bg-white border-b border-[#E7E5E4]">
        <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold text-[#1C1917] tracking-tight">
              About
            </h1>
            <p className="text-[11px] text-[#A8A29E] mt-0.5 tracking-wide">
              Texas Title Insurance Manual Assistant
            </p>
          </div>
          <Link
            href="/"
            className="text-[12px] text-[#A8A29E] hover:text-[#78716C] transition-colors duration-150"
          >
            Back to chat
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-12">
        <article>
          <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight mb-8">
            What is this tool?
          </h2>

          <div className="space-y-4 text-[14px] text-[#57534E] leading-[1.75]">
            <p>
              The Texas Title Insurance Manual Assistant is an AI-powered
              reference tool built on top of the{" "}
              <a
                href="https://www.tdi.texas.gov/title/titleman.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2563EB] hover:text-[#1D4ED8] underline decoration-[#93C5FD] underline-offset-2 hover:decoration-[#2563EB] transition-colors duration-150"
              >
                Texas Department of Insurance Basic Manual of Title Insurance
              </a>
              . It lets title insurance professionals ask plain-English questions
              about statutes, rate rules, procedural rules, forms, and
              administrative requirements — and get back accurate, cited answers
              in seconds.
            </p>

            <p>
              Instead of searching through hundreds of pages across eight manual
              sections, you type your question and the assistant finds the
              relevant statute sections, rules, and form references for you.
              Every answer includes specific citations so you can verify the
              source material yourself.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-[#E7E5E4]">
            <h3 className="text-lg font-semibold text-[#1C1917] tracking-tight mb-4">
              How it works
            </h3>

            <p className="text-[14px] text-[#57534E] leading-[1.75] mb-5">
              The tool is built on a technique called Retrieval-Augmented
              Generation (RAG). Here is what happens when you ask a question:
            </p>

            <ol className="space-y-4 text-[14px] text-[#57534E] leading-[1.75]">
              {[
                "Your question is converted into a mathematical representation (called an embedding) that captures its meaning.",
                "That embedding is compared against our database of nearly 1,000 content chunks drawn from every section of the Basic Manual — including the full text of Texas Insurance Code Title 11 (Chapters 2501–2751), all rate rules, procedural rules, administrative rules, claims procedures, and the text of over 60 official TDI forms.",
                "The most relevant chunks are retrieved and passed to Claude, an AI model by Anthropic, along with your question.",
                "Claude generates an answer grounded in that specific context, with citations pointing back to the exact statutes, rules, and forms.",
              ].map((text, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-[#E7E5E4] flex items-center justify-center text-[11px] font-semibold text-[#A8A29E] mt-0.5">
                    {i + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>

            <p className="text-[14px] text-[#57534E] leading-[1.75] mt-5">
              This approach means the assistant only answers from actual manual
              content — it does not make things up. If the answer is not in the
              manual, it will tell you.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-[#E7E5E4]">
            <h3 className="text-lg font-semibold text-[#1C1917] tracking-tight mb-4">
              What is covered
            </h3>

            <div className="space-y-3">
              {[
                {
                  label: "Texas Insurance Code Title 11",
                  desc: "Chapters 2501 through 2751, covering general provisions, prohibited conduct, title insurance companies, the guaranty association, agents and direct operations, escrow officers, closing and settlement, policy forms and premium rates, and personal property title insurance.",
                },
                {
                  label: "Rate Rules (R-1 through R-36)",
                  desc: "Premium rate schedules, owner\u2019s and mortgagee policy rates, simultaneous issuance, endorsement premiums, and special situations.",
                },
                {
                  label: "Procedural Rules (P-1 through P-73)",
                  desc: "Definitions, commitment procedures, endorsements, disbursement, division of premiums, closing disclosure, and licensing requirements.",
                },
                {
                  label: "Administrative Rules",
                  desc: "Agent and escrow officer licensing, minimum capitalization, surety bonds, audit requirements.",
                },
                {
                  label: "Official Forms",
                  desc: "Over 60 TDI forms including owner\u2019s and loan policies, endorsements, commitments, closing statements, and business forms.",
                },
                {
                  label: "Claims Handling",
                  desc: "Claims principles, procedures, and proof of loss requirements.",
                },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  className="px-4 py-3.5 bg-white border border-[#E7E5E4] rounded-xl shadow-[0_1px_2px_0_rgb(0_0_0/0.03)]"
                >
                  <span className="text-[13px] font-semibold text-[#1C1917]">
                    {label}
                  </span>
                  <span className="text-[13px] text-[#78716C]">
                    {" "}
                    &mdash; {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-[#E7E5E4]">
            <h3 className="text-lg font-semibold text-[#1C1917] tracking-tight mb-4">
              Important limitations
            </h3>

            <div className="space-y-4 text-[14px] text-[#57534E] leading-[1.75]">
              <p>
                This tool provides general reference information from the TDI
                Basic Manual. It is{" "}
                <strong className="text-[#1C1917] font-semibold">
                  not legal advice
                </strong>{" "}
                and should not be relied upon as a substitute for professional
                guidance. Always consult your underwriter or legal counsel for
                specific transactions or coverage questions.
              </p>

              <p>
                The content is sourced from the publicly available Basic Manual
                at{" "}
                <a
                  href="https://www.tdi.texas.gov/title/titleman.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] hover:text-[#1D4ED8] underline decoration-[#93C5FD] underline-offset-2 hover:decoration-[#2563EB] transition-colors duration-150"
                >
                  tdi.texas.gov
                </a>
                . While we work to keep the data current, the official TDI
                website is always the authoritative source for the most
                up-to-date rules and forms.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-[#F5F5F4]">
            <p className="text-[11px] text-[#D6D3D1]">
              Built by{" "}
              <a
                href="https://www.republicsquare.media/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A8A29E] hover:text-[#78716C] transition-colors duration-150"
              >
                Republic Square Media
              </a>{" "}
              for the Texas title insurance community.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

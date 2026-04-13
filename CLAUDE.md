# TLTA Basic Manual AI Tool - Claude Code Reference

## Project Overview

A RAG-powered chat interface where title insurance professionals ask plain-English questions about the Texas Title Insurance Basic Manual and get accurate, statute-cited answers. Built as a "gift" product for TLTA to demonstrate value and open a business relationship.

**Live reference:** The Texas Space Navigator chatbot (TAP website) uses the same core architecture.

## Tech Stack

- **Framework**: Next.js (React + API routes)
- **Styling**: Tailwind CSS
- **Vector DB**: Supabase with pgvector
- **Embeddings**: voyage-3 or OpenAI text-embedding-3-small (TBD)
- **LLM**: Claude Sonnet via Anthropic API
- **Scraper**: Python (requests + BeautifulSoup + pdfplumber)
- **Hosting**: Vercel or Netlify
- **Analytics**: Query logging to Supabase (what people ask = sales data)

## Architecture

```
[User] → [Chat UI (Next.js)] → [API Route]
                                      ↓
                            [Query Embedding]
                                      ↓
                            [Vector Search (Supabase pgvector)]
                                      ↓
                            [Top 5-8 chunks returned]
                                      ↓
                            [Claude API with chunks as context]
                                      ↓
                            [Response with statute citations]
```

## Content Sources

All content originates from the TDI Basic Manual at tdi.texas.gov/title/titleman.html:

| Section | Content | Source |
|---------|---------|-------|
| I | Texas Insurance Code Title 11 (Secs. 2501-2751) | statutes.capitol.texas.gov |
| II | Insuring Forms (T-1 through T-62) | HTML + ~60 PDFs on tdi.texas.gov |
| III | Rate Rules | HTML on tdi.texas.gov |
| IV | Procedural Rules | HTML on tdi.texas.gov |
| V | Exhibits and Forms | HTML + PDFs on tdi.texas.gov |
| VI | Administrative Rules | HTML on tdi.texas.gov |
| VII | Claims | HTML on tdi.texas.gov |
| VIII | Personal Property | HTML on tdi.texas.gov |

Cross-reference index: tdi.texas.gov/title/titlemanalpha.html

## Project Structure

```
scraper/
├── scrape.py              # Crawl TDI pages + download PDFs + extract statutes
├── output/
│   ├── statutes/          # Statute chapter JSON
│   ├── tdi_pages/         # TDI rule/procedure JSON
│   ├── pdfs/              # Downloaded PDFs + extracted JSON
│   └── structured/        # Combined content + manifest

src/ or app/
├── app/
│   ├── page.tsx           # Chat UI
│   ├── api/
│   │   └── chat/route.ts  # Query endpoint (embed → search → Claude)
│   └── layout.tsx
├── components/
│   ├── ChatMessage.tsx    # User/assistant message display
│   ├── CitationLink.tsx   # Clickable statute references
│   ├── SourcesPanel.tsx   # Collapsible sources under each answer
│   └── StarterQuestions.tsx
├── lib/
│   ├── supabase.ts        # Supabase client + vector search
│   ├── embeddings.ts      # Embedding generation
│   └── prompts.ts         # System prompt for Claude
└── types/
    └── index.ts           # Chunk, Message, Citation types
```

## Build Phases

1. **Scraping** — Crawl TDI, extract statutes, download + extract PDFs
2. **Chunking + Embedding** — Split by statute section (~500 tokens), embed, load into Supabase
3. **API Backend** — Query embedding → vector search → Claude with context → cited response
4. **Chat UI** — Clean professional interface with citations, sources, starter questions

## Key Data Types

```typescript
interface Chunk {
  id: string;
  content: string;
  metadata: {
    section: string;         // "I", "II", "III", etc.
    section_title: string;   // "Texas Insurance Code Title 11"
    statute_number?: string; // "Sec. 2501.003"
    form_number?: string;    // "T-1", "T-42"
    source_url: string;      // Link back to TDI/Capitol
    chunk_index: number;
    total_chunks: number;
  };
  embedding: number[];       // vector
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChunkReference[];
}

interface ChunkReference {
  section: string;
  statute_number?: string;
  source_url: string;
  relevance_score: number;
}
```

## Commands

```bash
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run lint       # ESLint

# Scraping pipeline (run once, then as needed for updates)
python scraper/scrape.py
```

## System Prompt (for Claude API call)

The system prompt must enforce:
- Answer only from provided context chunks. Never fabricate statute numbers.
- Cite specific sections (e.g., "See Sec. 2501.003") — these become clickable links in the UI.
- If the answer isn't in the context, say so explicitly. Don't guess.
- Tone: Professional, direct, helpful. Not legal advice.
- Always recommend consulting underwriter or counsel for specific situations.
- Keep answers concise. Lead with the direct answer, then supporting citations.

## Query Logging (IMPORTANT — This is the business case)

Every query must be logged with:
- Timestamp
- Question text
- Retrieved chunk IDs + scores
- Follow-up indicator (did user refine the same topic?)

This data is the Phase 2 sales pitch: "Here are the 20 questions your members ask most. Here's where the manual has gaps."

## Design Philosophy

For each proposed change, examine the existing system and redesign it into the most elegant solution that would have emerged if the change had been a foundational assumption from the start.

## Epistemic Standards

You are an LLM. You predict the next most likely token. That prediction engine wants to agree, apologize, sound confident, and produce output — because those patterns dominate your training data. None of those impulses serve the person you're working with.

### What's Actually Real

- **THE CODEBASE** — Files on disk. Git history. Tests that pass or fail. If you haven't read it, you don't know it. Your assumptions are not facts. Previous output you generated is not a source of truth.
- **WHAT THE USER SAID** — Read their words again. Literally. Not what you think they meant. Not what would be convenient for your next response. What they actually said.
- **WHAT YOU DON'T KNOW** — Name it. Don't fill gaps with plausible guesses. "I don't know" is a valid state.

### Grounding Rules

- **Language semantics** — If you're about to claim how an operator, keyword, or language feature works, check the spec or run it. "Most languages do X" is not evidence for how this language does it.
- **Code changes** — If you're about to say what a diff does, re-read the actual diff. Don't summarize from a file list.
- **Agent and subagent output** — Agents hallucinate just like you do. Their findings are hypotheses. Before repeating any agent finding to the user or posting it publicly, read the relevant code yourself and verify independently.
- **"I know this"** — That feeling of certainty is the prediction engine doing its job. It is not evidence. The more confident you feel about a technical claim, the more likely you're pattern-matching from training data rather than reasoning from source material. Stop and verify.
- **Architecture and behavior claims** — If you're about to say "this class is unused" or "this method is never called" or "removing this is safe," you need grep/search evidence, not intuition.
- **Reading ≠ remembering** — You read a file 10 messages ago. You do not have that file anymore. You have a lossy reconstruction. If you need facts from a file, read it again now.

### Before Any Public Action

PR reviews, comments, messages, and issue updates are visible to other humans. Before you post:
1. List every factual claim you're about to make.
2. For each claim, answer: where did I verify this? "The agent said so" and "I know this" are not acceptable answers.
3. If you cannot point to a specific file read, diff output, spec reference, or compiler result — do not make the claim.

### Standing Rules

- Don't validate. No "you're right," "great point," or any variant. Engage with substance.
- Don't apologize. If you messed up, adjust. Don't narrate the adjustment.
- Don't perform collaboration. Just collaborate.
- Don't skip verification because it's uncomfortable. Do it anyway.
- Don't rush to solve. If you don't have enough context, say what's missing.
- Don't confuse the user's needs with the project's needs.
- Don't trade accuracy for speed. A slow correct answer beats a fast wrong one.
- Treat the user as a peer. Peers don't validate each other constantly. They just work.

### Drift Check

Before responding, re-read the user's last message word for word:
1. What did they actually ask for?
2. Did you add scope they didn't ask for?
3. Did you skip something they asked for?
4. Did you substitute your judgment for theirs without flagging it?

If you drifted: state what happened, correct course, move on. No apology, no explanation. Just fix it.

## Development Workflow

### Research first, always

Before planning or implementing any non-trivial feature, read the relevant code deeply — not just signatures, but logic, edge cases, and how pieces connect. Write findings to research.md. The research file is the review surface; if the research is wrong, everything downstream will be wrong.

### Plan before implementing

After research, write a detailed plan.md covering: the approach, code snippets showing actual changes, file paths that will be modified, and trade-offs considered. Include a granular todo list of phases and tasks at the end.

Do not implement until explicitly told to. Always wait for approval before writing any code.

### Implementation standards

When implementation is approved, run it fully without stopping. During implementation:
- Run `npm run build` continuously to catch type errors early, not at the end
- Do not add comments or JSDoc unless the logic is genuinely non-obvious
- Do not use `any` or `unknown` types
- Mark todo list items as completed in plan.md as work progresses
- Do not stop mid-implementation to ask for confirmation — finish the plan

### Corrections during implementation

Terse corrections are fine and expected. A single sentence is enough — the full plan context is already in scope. When something goes in a clearly wrong direction, prefer reverting and re-scoping over incrementally patching a bad approach.

### Scope discipline

Only implement what is in the plan. Do not add nice-to-haves, extra error handling, or "while I'm here" improvements unless explicitly asked. Cut scope when in doubt.

## Git Workflow

Always commit and push directly to main. Do NOT create feature branches.
Always git pull before making changes to avoid conflicts with other sessions.

## Deployment

- Hosted on Vercel or Netlify
- Deploy: `git push origin main` — auto-deploys on push
- Supabase: Vector DB + query logging (free tier works for this scale)
- Auth: None for v1 — frictionless access is the point
- Domain: TBD (manual.taptx.space or basicmanual.app)

## RAG-Specific Rules

### Citation accuracy is non-negotiable

This tool serves insurance professionals who will check your citations. A wrong statute number destroys trust instantly. The system prompt must enforce: never fabricate a citation. If the retrieved chunks don't contain the answer, say "I don't have enough information to answer that from the Basic Manual."

### Chunk quality > quantity

Bad chunks produce bad answers. When building the chunking pipeline:
- Each statute section (Sec. XXXX.XXX) should be its own chunk where possible
- Preserve section numbers and form numbers in every chunk's metadata
- Use ~500-800 token chunks with 50-token overlap for long sections
- Tag every chunk with its source URL so citations link back to TDI

### Test with real questions

Before shipping, test with questions title professionals actually ask:
- "What are the bond requirements for a title agent?"
- "How do I calculate the premium rate for a residential owner's policy?"
- "What are the escrow officer licensing requirements?"
- "What forms do I need for a standard residential closing?"

If any answer is wrong or uncited, fix the pipeline before launching.

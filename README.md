ProofPing
=========

Send specific outreach with proof, not generic AI spam.

ProofPing analyzes a pasted opportunity, selects the most relevant proof link,
generates three short outreach variants, writes a follow-up, and scores whether
the message sounds specific or generic.

Phase 1 keeps the product intentionally personal and lightweight: mark generated
variants as sent, then track replies, positive replies, calls booked, reply
rate, meeting rate, and the best/worst performing variants in local storage.

## Stack

- Next.js app router
- OpenRouter chat completions API
- Two-model pipeline for cheap analysis/scoring and stronger final copy
- Zod request and response validation
- Local proof bank defaults
- LocalStorage saves for the MVP
- LocalStorage outreach tracker for the 100-message sprint

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your OpenRouter key to `.env.local`:

```bash
OPENROUTER_API_KEY=your_key_here
OPENROUTER_UTILITY_MODEL=openai/gpt-5.4-nano
OPENROUTER_GENERATION_MODEL=openai/gpt-5.4-mini
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The API route lives at `app/api/generate-outreach/route.ts`.

## Model Pipeline

ProofPing keeps expensive quality where it matters:

1. Analyze opportunity and select proof link with `OPENROUTER_UTILITY_MODEL`.
2. Generate the three final outreach variants with `OPENROUTER_GENERATION_MODEL`.
3. Score generic risk and specificity with `OPENROUTER_UTILITY_MODEL`.

Good eval candidates:

- Final message quality: `openai/gpt-5.4-mini`, `anthropic/claude-haiku-4.5`, `kimi-k2.6`
- Cheap utility work: `openai/gpt-5.4-nano`, `deepseek/deepseek-v4-flash`, `qwen/qwen3.6-flash`
- Batch testing: `deepseek/deepseek-v4-flash`
- Long-context fallback: `google/gemini-3-flash-preview`, `qwen/qwen3.6-flash`

# ProofPing Model Eval

Run this before changing default models.

## Candidate Set

Final message quality:

- `openai/gpt-5.4-mini`
- `anthropic/claude-haiku-4.5`
- `kimi-k2.6`

Cheap utility work:

- `openai/gpt-5.4-nano`
- `deepseek/deepseek-v4-flash`
- `qwen/qwen3.6-flash`

## Test Set

Use 10 real or realistic opportunities:

1. Startup job post, AI engineer
2. Startup job post, full-stack engineer
3. Startup job post, automation engineer
4. Upwork gig, workflow automation
5. Upwork gig, Next.js app build
6. Founder LinkedIn bio, seed-stage SaaS
7. Founder LinkedIn bio, local services business
8. Local business website, operations pain
9. Local business website, lead generation pain
10. YC company profile

## Score Each Output

Use a 1-10 score for:

- Specificity
- Human tone
- Generic risk, where 10 means low risk
- Proof-link relevance

Also record:

- Schema validity: pass/fail
- Would I actually send this?: yes/no
- Notes: what made it better or worse

The winning setup is the one that writes messages you would actually send, not
the one that looks smartest in isolation.

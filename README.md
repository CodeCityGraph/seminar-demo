# Simple HTML App Testing Pipeline

Clean local + CI workflow for feature-by-feature test gating, plus AI-powered test generation (local Ollama by default, Gemini optional).

## Quick Start

```bash
npm ci
npm run playwright:install
```

Run app from working code:

```bash
npm run start:local
```

Run full local pipeline:

```bash
npm run pipeline:local
```

Run AI-assisted pipeline (local Ollama generates tests, then runs full gate):

```bash
ollama serve
npm run ai:ollama:pull
export AI_MODEL_PROVIDER="ollama"
npm run ai:pipeline
```

Optional Gemini mode:

```bash
export AI_MODEL_PROVIDER="gemini"
export GEMINI_API_KEY="your_key_here"
npm run ai:pipeline
```

Show latest report paths:

```bash
npm run pipeline:latest
npm run ai:latest
```

Run app from last safe copy:

```bash
npm run start:safe
```

## What `pipeline:local` Does

1. Creates a timestamped snapshot of your current code.
2. Runs test batches in this order:
   - `smoke`
   - `forms + validation`
   - `theme + state + e2e`
   - `accessibility`
3. Writes HTML report per batch + one summary file.
4. On failure:
   - exits with non-zero status
   - archives code under `pipeline/failed/<run-id>`
   - does not update `safe/current`
5. On success:
   - updates `safe/current`
   - archives safe copy under `safe/runs/<run-id>`

## What `ai:pipeline` Does

1. Detects changed files from Git.
2. Sends changed code context to the configured provider (`ollama` or `gemini`).
3. Writes generated tests into `tests/ai-generated/`.
4. Runs AI-generated tests first.
5. Runs `pipeline:local` full validation gate.
6. Writes AI artifacts under `pipeline/reports/ai/<run-id>/`.

## Folder Layout

- `pipeline/runs/<run-id>/source` - tested source snapshot
- `pipeline/reports/<run-id>/summary.md` - batch summary
- `pipeline/reports/<run-id>/<batch>/html/index.html` - batch HTML report
- `pipeline/reports/ai/<run-id>/summary.md` - AI generation summary
- `pipeline/reports/ai/<run-id>/raw-response.txt` - raw model response
- `tests/ai-generated/` - AI-generated tests
- `pipeline/failed/<run-id>` - snapshot from failed run
- `safe/current` - latest passing snapshot
- `safe/runs/<run-id>` - archived passing snapshots

## CI/CD (GitHub + Vercel)

Workflow file: `.github/workflows/deploy.yml`

Trigger: push to `dev`

Flow:

1. Run Playwright test batches.
2. If all pass, fast-forward `main` to `dev`.
3. Deploy `main` to Vercel production.

Required repo secrets:

- `VERCEL_TOKEN`
- `ORGID`
- `PROJECTID`

## Seminar Demo Guide

Detailed live demo steps are in:

- `SEMINAR_DEMO_GUIDE.md`

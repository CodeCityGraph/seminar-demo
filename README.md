# Simple HTML App AI Testing Pipeline

This repo is configured in **fresh AI-testing mode**.
There are no prebuilt manual test suites. Tests are generated into `tests/ai-generated/` and then executed.

## Quick Start

```bash
npm ci
npm run playwright:install
npm run start:local
```

## MongoDB Secrets (for login/signup)

Set these environment variables in your deployment secrets (for example, Vercel project environment variables):

- `MONGODB_URI` (required)
- `MONGODB_DB` (optional, defaults to `seminar_demo`)
- `MONGODB_USERS_COLLECTION` (optional, defaults to `users`)

`/api/submit` uses MongoDB for `formType: "signup"` and `formType: "login"`.

## Generate + Run AI Tests (Fast Demo)

### Local model (recommended)

```bash
ollama serve
npm run ai:ollama:pull
export AI_MODEL_PROVIDER="ollama"
export OLLAMA_MODEL="codellama:7b-instruct"
export AI_REQUEST_TIMEOUT_MS=180000
npm run ai:pipeline
```

### Gemini (optional)

```bash
export AI_MODEL_PROVIDER="gemini"
export GEMINI_API_KEY="your_key_here"
export GEMINI_MODEL="gemini-2.5-flash-lite"
npm run ai:pipeline
```

## Core Commands

```bash
npm run ai:generate-tests   # only generate tests into tests/ai-generated
npm run ai:pipeline         # generate + run generated tests + run AI-only local gate
npm run ai:clean            # remove generated spec files
npm run ai:latest           # show latest AI report paths
npm run pipeline:local      # run AI-only local test gate
npm run pipeline:latest     # show latest local gate report paths
```

## Fresh Mode Behavior

- Only `tests/ai-generated/` is used for Playwright execution.
- If there are no generated tests, pipeline fails with guidance.
- Reports are written to:
  - `pipeline/reports/ai/<run-id>/...`
  - `pipeline/reports/<run-id>/...`
- Passing local gate updates `safe/current`.

## CI/CD

Workflow: `.github/workflows/deploy.yml`

On `dev` push:
1. Optionally generate tests via Gemini if secret is present.
2. Run only `tests/ai-generated`.
3. If pass, promote `dev` to `main`.
4. Deploy `main` to Vercel.

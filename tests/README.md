# Playwright UI/UX Suite

## Setup

```bash
npm install
npm run playwright:install
```

## Run all tests

```bash
npm run test:e2e
```

## Run by suite

```bash
npx playwright test tests/accessibility
npx playwright test tests/e2e
npx playwright test tests/state
npx playwright test tests/theme
npx playwright test tests/forms
npx playwright test tests/visual
```

## Visual snapshots

Generate or refresh snapshots:

```bash
npm run test:e2e:update-snapshots
```

Playwright stores snapshot baselines under:

- `tests/visual/theme-visual.spec.ts-snapshots/`

## Optional debugging

```bash
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:debug
```

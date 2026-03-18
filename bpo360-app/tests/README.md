# BPO360 Test Framework

## Overview

This project uses **Playwright** for end-to-end (E2E) testing of the Next.js BPO360 app.

- Tests live in `tests/e2e`
- Shared helpers and fixtures live in `tests/support`
- Playwright is configured via `playwright.config.ts` at the project root

The goals of this setup are:

- Fast, stable smoke/regression coverage for core flows
- Clear structure for adding new tests
- Good defaults for CI (parallelism, artifacts, reporters)

## Installation & Setup

1. Install dependencies (from the `bpo360-app` folder):

```bash
pnpm install
pnpm exec playwright install --with-deps
```

2. Configure environment variables:

- Copy `.env.example` → `.env.local`
- Make sure these keys are set for local E2E:
  - `TEST_ENV=local`
  - `BASE_URL=http://localhost:3000`

3. Start the application:

```bash
pnpm dev
```

## Running Tests

### Local (headless)

```bash
pnpm test:e2e
```

### Local (headed / debug)

```bash
pnpm exec playwright test --headed
pnpm exec playwright test --debug
```

You can also run a single test file:

```bash
pnpm exec playwright test tests/e2e/example.spec.ts
```

## Architecture

**Directories:**

- `tests/e2e`:
  - High-level E2E specs, each describing a user flow (e.g. login, today dashboard, focus mode).
- `tests/support/fixtures`:
  - Data factories and sample entities (e.g. `makeTestUser`).
- `tests/support/helpers`:
  - UI helpers and flows (e.g. `loginAsTestUser`, navigation helpers).

**Config (`playwright.config.ts`):**

- `testDir: ./tests/e2e`
- Timeouts:
  - action: 15s
  - navigation: 30s
  - test: 60s
- Artifacts:
  - traces, screenshots, and videos retained on failure
- Reporters:
  - list (console)
  - HTML report
  - JUnit XML for CI

## Best Practices

- **Selectors**:
  - Prefer `data-testid` attributes for stable selectors.
  - Avoid brittle text or CSS selectors tied to styling.
- **Isolation**:
  - Each test should be independent and re-runnable.
  - Use helpers/fixtures to create any required state.
- **Cleanup**:
  - Prefer idempotent flows (e.g. can run even if data already exists).
  - When needed, add cleanup helpers (API calls or DB scripts) instead of UI-driven cleanup.

## CI Integration

- CI can run:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps
pnpm test:e2e
```

- JUnit XML is written to `test-results/junit-e2e.xml`.
- HTML report is generated in `playwright-report/`.


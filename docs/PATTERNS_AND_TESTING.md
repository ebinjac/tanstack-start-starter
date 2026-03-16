# Project patterns: server actions, logging (OTel/Pino), and testing

**Use this document when making changes.** Attach it to prompts so LLMs follow the same patterns for server actions, logging, and tests.

---

## 1. Server actions pattern

### Structure

Every server function in this project must:

1. Use **`createServerFn`** from `@tanstack/react-start` with an explicit method (`GET` or `POST`).
2. Use **`.inputValidator()`** with a Zod schema (or `z.parse`) so invalid input is rejected before the handler runs.
3. Wrap the **handler body** in **`withServerFnTracing("ExactFnName", async () => { ... })`** from `@/lib/server/tracing`.
4. Use **`runWithDb`** for read-only work (with a fallback on error) or **`runMutation`** for writes (logs then throws a safe message).
5. Use **`getDbContext()`** (or dynamic `import("@/db")` / `import("@/db/schema")`) only inside the handler; do not import db at top level in shared files.

### Template

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod"; // or your schema from @/lib/zod
import { requireSession } from "@/lib/session";  // only if auth required
import { getDbContext, runWithDb, runMutation } from "@/lib/server/run";
import { withServerFnTracing } from "@/lib/server/tracing";

const LOG_PREFIX = "[your-domain]";

// Read-only: use runWithDb + fallback
export const getSomethingFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => yourSchema.parse(data))
  .handler(async ({ data }) =>
    withServerFnTracing("getSomethingFn", async () => {
      return runWithDb(
        async () => {
          const { db, schema, orm } = await getDbContext();
          // ... query
          return result;
        },
        { fallback: [], logPrefix: LOG_PREFIX, logContext: "Failed to fetch ..." },
      );
    }),
  );

// Mutation (auth required): use requireSession + runMutation
export const createSomethingFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSomethingSchema.parse(data))
  .handler(async ({ data }) =>
    withServerFnTracing("createSomethingFn", async () => {
      await requireSession();
      return runMutation(
        async () => {
          const { db, schema } = await getDbContext();
          // ... insert/update
          return result;
        },
        { errorMessage: "User-friendly message", logPrefix: LOG_PREFIX, logContext: "Create failed" },
      );
    }),
  );
```

### Rules

- **Naming**: Export name must match the string passed to `withServerFnTracing` (e.g. `createSessionFn` and `"createSessionFn"`).
- **Auth**: For actions that require a user, call `await requireSession()` at the start of the handler (inside `withServerFnTracing`).
- **Errors**: Do not catch and rethrow arbitrarily; let `runWithDb`/`runMutation` handle logging. Use `runWithDb` when you want to return a fallback (e.g. `[]`); use `runMutation` when the client must see an error.
- **Session context**: After creating or updating session data, call `setRequestUserContext({ userId, adsId })` from `@/lib/log` so later logs and spans include user context.

---

## 2. Logging (OTel and Pino)

### Where to log

- **Server-only**: Use **Pino** via `getRequestLogger()` from `@/lib/log`. Never use `console.log` for app logs in server code.
- **Request-scoped**: Always use **`getRequestLogger()`** (not `getRootLogger()`) inside server functions, middleware, or any request handler so that `requestId`, `serverFn`, `userId`, `adsId`, `traceId`, and `spanId` are attached automatically.

### How to log

```ts
import { getRequestLogger } from "@/lib/log";

const log = getRequestLogger();
log.info({ key: "value" }, "message");           // structured
log.error({ err, operation: "name" }, "failed"); // errors: pass err for serialization
log.debug({ id }, "detail");
```

- Use **structured fields** as the first argument (object) and a short **message** string as the second.
- For errors, include `err` in the object (and optional context like `operation` or `logContext`). The logger serializes `Error` (message, name, stack).
- Do **not** pass redundant request context (requestId, serverFn, userId, adsId); `getRequestLogger()` already binds those.

### OTel (traces)

- **Server function spans**: Handled by `withServerFnTracing`. Do not create manual spans for the handler; the wrapper creates the span and sets `server.function.name`, `user.id`, `user.ads_id`.
- **Custom metrics**: Use `getOtelMeter()` from `@/lib/otel` for counters/histograms. Do not add one-off spans for every operation; use the existing HTTP + server-function span tree.

### What we do not log

- Every HTTP request (no request_start/request_complete). Only **server function invocations** (`server_fn_invoked`) and **errors** (from runWithDb/runMutation and request_error in middleware) are logged.

---

## 3. Testing: what to write and how

### Test coverage (current)

- **Overall**: ~5.7% lines/statements (thresholds are 0; raise as you add tests).
- **Fully covered**: `auth.schema`, `query-keys`, `run.ts` (runWithDb/runMutation), `status-badge`, `auth-guard`, `error-boundary`, and server function **input validation** for `createSessionFn`.
- Run `pnpm run test:coverage` to see the report.

### What must be tested

| Layer | What | How |
|-------|------|-----|
| **Pure logic** | Zod schemas, query keys, `runWithDb`/`runMutation` | Unit tests; mock `@/lib/log` for run*.ts. |
| **Components** | UI components (presentational or with hooks) | Vitest + React Testing Library; mock hooks and router when needed. |
| **Server actions** | Input validation only (handler needs Start context) | Call the server function with invalid payloads; expect validation to throw. |
| **E2E** | Critical flows (login, create request, admin) | Playwright against dev/preview. |

### Unit test patterns

- **Schemas** (`src/lib/zod/*.test.ts`): `schema.parse(valid)` and `expect(() => schema.parse(invalid)).toThrow()`.
- **runWithDb / runMutation** (`src/lib/server/run.test.ts`): Mock `@/lib/log`; test fallback on throw and error message rethrow. Use `// @vitest-environment node` at top of file.
- **Components**: Use `@testing-library/react`, `within(container)` when multiple instances in DOM, and `vi.mock` for `@/hooks` or `@tanstack/react-router`. Use `@testing-library/jest-dom` matchers (e.g. `toBeInTheDocument()`); setup is in `src/test/setup.ts`.
- **Router in tests**: Use `src/test/router-mock.ts` and `vi.mock("@tanstack/react-router", () => mockRouter)`; override `useLoaderData`/`useSearch` per test.

### Server function tests

- **Do**: Test that invalid input is rejected (e.g. `createSessionFn({ data: invalid }).rejects.toThrow()`).
- **Do not**: Invoke the full handler in Vitest (it requires TanStack Start AsyncLocalStorage context). Full behavior is covered by E2E or by extracting pure logic into testable functions.

### E2E (Playwright)

- Config: `playwright.config.ts`; tests in `e2e/*.spec.ts`.
- Use `pnpm run test:e2e`; `webServer` starts the dev server when not in CI.
- Prefer `getByRole`, `getByText`, and `data-testid` over class-based selectors.

### Adding a new server action

1. Implement the action following the server actions pattern above.
2. Add a **unit test** for **input validation** (invalid payload throws).
3. Optionally add **E2E** for the happy path if it is a critical flow.

---

## 4. File reference

| Path | Purpose |
|------|---------|
| `src/actions/*.fn.ts` | Server functions (auth, teams, etc.). |
| `src/lib/server/run.ts` | `getDbContext`, `runWithDb`, `runMutation`. |
| `src/lib/server/tracing.ts` | `withServerFnTracing`. |
| `src/lib/log/*` | `getRequestLogger()`, request context, Pino. |
| `src/lib/otel/index.ts` | OTel init, `getOtelTracer()`, `getOtelMeter()`, `getTraceSpanIds()`. |
| `src/test/setup.ts` | Vitest setup; jest-dom. |
| `src/test/router-mock.ts` | TanStack Router mocks for route tests. |
| `docs/LOGGING_AND_OTEL.md` | Full OTel/Pino and env var reference. |

---

## 5. Checklist for changes

When adding or changing server actions, logging, or UI:

- [ ] Server function uses `withServerFnTracing("ExactFnName", ...)` and `runWithDb` or `runMutation`.
- [ ] Input is validated with `.inputValidator()` and a Zod schema.
- [ ] Logging uses `getRequestLogger()` and structured fields; no `console.log` in server code.
- [ ] New or updated logic has a unit test (schema, runWithDb/runMutation, or component); new server function has at least a validation test.
- [ ] `pnpm run test` and `pnpm run test:coverage` pass (and E2E if you changed critical flows).

# Logging and OpenTelemetry (OTel)

This document describes how logging and OpenTelemetry are set up and what gets sent to the collector.

---

## What we log (and what we don’t)

We only log **actions** and **errors**. We do **not** log every HTTP request (e.g. home page, static assets).

| What | Logged? | Where |
|------|--------|--------|
| **Server function invoked** | Yes | One line per server function call: `server_fn_invoked` with `serverFn`, `requestId`, `userId`, `adsId`. |
| **Errors** | Yes | From `runWithDb`/`runMutation` (with `serverFn`, `logContext`) and from request middleware as `request_error` via `getRequestLogger()` (bindings include `requestId`, `serverFn`, `userId`, `adsId`, plus `err`, `durationMs`). |
| **Every request (e.g. GET /)** | No | Request-level `request_start` / `request_complete` were removed to avoid noise. |
| **Metrics** | Yes | HTTP request count and duration are still recorded and sent to OTel (no log line per request). |

So you see **which server function ran** and **any failure**, with user and request context, without flooding logs with page loads.

---

## OpenTelemetry setup

### Signals and endpoints

| Signal | Purpose | Default endpoint (env override) |
|--------|---------|---------------------------------|
| **Traces** | HTTP + server function spans | `OTEL_EXPORTER_OTLP_ENDPOINT` or `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` |
| **Logs** | Pino → OTLP | `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` (base; transport appends `/v1/logs`) |
| **Metrics** | Request count/duration, custom | `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` |

Default base URL is configured in `src/lib/otel/index.ts` (e.g. `https://otelcolector-dev.com`). Set `OTEL_EXPORTER_OTLP_ENDPOINT` to change the base for all three.

### Traces

- **HTTP**: `@opentelemetry/instrumentation-http` creates a span per incoming request (method, route, status).
- **Server functions**: Each server function runs inside `withServerFnTracing("FunctionName", handler)`, which:
  - Creates a **child span** named after the function (e.g. `createSessionFn`, `getTeamsByIdsFn`).
  - Sets span attributes: `server.function.name`, `user.id`, `user.ads_id` (when available).
  - Ensures errors are recorded on the span.

So in OTel you get: **HTTP span → server function span** with user and function name on the inner span.

### Logs

- **Pino** is used for all application logs (structured JSON).
- When `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` is set, **pino-opentelemetry-transport** sends log records to the OTLP logs endpoint.
- Logs include **trace/span context** when inside a traced request (so logs and traces can be correlated).
- Request context (e.g. `requestId`, `serverFn`, `userId`, `adsId`) is attached via `getRequestLogger()`.

### Metrics

- **HTTP**: `http.server.request.count` and `http.server.request.duration_ms` with attributes (method, route, status).
- **Custom**: Use `getOtelMeter()` from `@/lib/otel` to create counters, histograms, etc.

---

## Implementation details

### Server function tracing

Every server function handler is wrapped with `withServerFnTracing` from `@/lib/server/tracing`:

```ts
import { withServerFnTracing } from "@/lib/server/tracing";

export const myFn = createServerFn({ method: "POST" })
  .handler(async ({ data }) =>
    withServerFnTracing("myFn", async () => {
      // ... handler body
      return result;
    }),
  );
```

This:

1. Sets the current **server function name** on the request context (so error logs from `runWithDb`/`runMutation` include `serverFn`).
2. Creates an **OTel span** for the function with attributes `server.function.name`, `user.id`, `user.ads_id`.
3. Logs **one line**: `server_fn_invoked` (context comes from the request logger’s bindings: `serverFn`, `requestId`, `userId`, `adsId`, `traceId`, `spanId`).
4. Runs the handler; on error, records the exception on the span and rethrows (errors are still logged by `runWithDb`/`runMutation`).

### Request context

- Set in **global request middleware** (`src/start.ts`): `requestId`, `method`, `path`, `startTime`.
- **User** (`userId`, `adsId`) is set when session is available (e.g. in `requireSession()`, or after `getSessionFn`/`createSessionFn`/`refreshSessionFn`).
- **Server function name** is set by `withServerFnTracing`.

So every log line from `getRequestLogger()` in that request can include `requestId`, `serverFn`, `userId`, `adsId`, plus `traceId`/`spanId` when tracing is active.

### What is *not* logged

- **request_start** / **request_complete** for every HTTP request (removed to avoid noise; home page and static requests are not logged).
- **request_error** is still logged when a request throws, with full context (including `serverFn` if set).

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Base URL for traces, logs, metrics (no path). |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Override trace endpoint (full URL). |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Override logs base (transport appends `/v1/logs`). |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | Override metrics endpoint. |
| `OTEL_SERVICE_NAME` | Service name in telemetry (default: `ensemble`). |
| `OTEL_SERVICE_VERSION` | Optional service version. |
| `LOG_LEVEL` | Pino level: `trace` \| `debug` \| `info` \| `warn` \| `error`. |

**Collector config:** If you use a local OTel collector (e.g. `otel-config/`) that forwards to a vendor (Axiom, etc.), avoid hardcoding API keys in YAML. Use environment variable substitution or a secrets manager supported by your collector; see `otel-config/README.md` if present.

---

## Usage

### Logging in server code

```ts
import { getRequestLogger } from "@/lib/log";

const log = getRequestLogger();
log.info({ key: "value" }, "message");
log.error({ err }, "operation_failed");
```

Use only in server code. Prefer dynamic `await import("@/lib/log")` inside server-only branches if the file is shared with the client.

### Adding a new server function

1. Wrap the handler with `withServerFnTracing("YourFnName", async () => { ... })`.
2. Use `runWithDb` / `runMutation` for DB work so errors are logged with `serverFn` and context.

### Custom metrics

```ts
import { getOtelMeter } from "@/lib/otel";

const meter = getOtelMeter();
const counter = meter.createCounter("my.counter", { description: "..." });
counter.add(1, { tag: "value" });
```

### Graceful shutdown

`src/start.ts` registers SIGTERM and SIGINT handlers that call `shutdownOtel()` then exit, so OTel exporters flush on process shutdown. To add custom shutdown logic elsewhere:

```ts
import { shutdownOtel } from "@/lib/otel";

process.on("SIGTERM", () => {
  shutdownOtel().finally(() => process.exit(0));
});
```

---

## File reference

| Path | Purpose |
|------|---------|
| `src/lib/otel/index.ts` | OTel init: trace provider, HTTP instrumentation, meter provider, OTLP exporters; `getOtelTracer()`, `getOtelMeter()`, `getTraceSpanIds()`, `shutdownOtel()`. Single source for trace/span IDs; `src/lib/log/logger.server.ts` uses `getTraceSpanIds()` from here for log correlation. |
| `src/lib/log/*` | Pino logger, request context (AsyncLocalStorage), server/browser split. |
| `src/lib/server/tracing.ts` | `withServerFnTracing(name, fn)`: span + one log line per server function. |
| `src/lib/server/run.ts` | `runWithDb` / `runMutation`; log errors with request logger (includes `serverFn` from context). |
| `src/start.ts` | Request middleware: sets request context, records metrics, registers SIGTERM/SIGINT for OTel shutdown, logs `request_error` via `getRequestLogger()`. |

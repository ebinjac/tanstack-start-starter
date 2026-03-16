/**
 * TanStack Start entry — global middleware for request tracing and logging.
 * Server-only code (OTel, Pino, request context) is loaded only when SSR so the client
 * never pulls in async_hooks, Pino, or OTel (routeTree.gen.ts imports this file).
 */

import { createMiddleware, createStart } from "@tanstack/react-start";
import type { RequestContext } from "@/lib/log/request-context-types";

export const startInstance = createStart((async () => {
	if (typeof import.meta.env === "undefined" || !import.meta.env.SSR) {
		return { requestMiddleware: [] };
	}

	const { initOtel, getOtelMeter, shutdownOtel } = await import("@/lib/otel");
	const { getRequestLogger, runWithRequestContext } = await import("@/lib/log");

	initOtel();

	let shutdownHandled = false;
	function handleShutdown() {
		if (shutdownHandled) return;
		shutdownHandled = true;
		shutdownOtel().finally(() => process.exit(0));
	}
	process.on("SIGTERM", handleShutdown);
	process.on("SIGINT", handleShutdown);

	const METER = getOtelMeter();

	const requestCount = METER.createCounter(
		"http.server.request.count",
		{ description: "Total HTTP requests" },
	);
	const requestDuration = METER.createHistogram(
		"http.server.request.duration_ms",
		{ description: "Request duration in milliseconds", unit: "ms" },
	);

	function readRequestId(request: Request): string {
		const id = request.headers.get("x-request-id") ?? request.headers.get("traceparent")?.split("-")[1];
		return id ?? crypto.randomUUID();
	}

	function pathFromRequest(request: Request): string {
		try {
			return new URL(request.url).pathname;
		} catch {
			return request.url;
		}
	}

	const requestTracingMiddleware = createMiddleware().server(
		async ({ next, request }) => {
			const requestId = readRequestId(request);
			const method = request.method;
			const path = pathFromRequest(request);
			const startTime = performance.now();

			const context: RequestContext = {
				requestId,
				method,
				path,
				startTime,
			};

			try {
				const result = await runWithRequestContext(context, async () => {
					return await next();
				});

				const durationMs = Math.round(performance.now() - startTime);
				const res = result as Response | { status?: number } | undefined;
				const status =
					typeof res?.status === "number"
						? res.status
						: res instanceof Response
							? res.status
							: 200;

				requestCount.add(1, {
					method,
					"http.route": path,
					"http.response.status_code": status,
				});
				requestDuration.record(durationMs, { method, "http.route": path });

				return result;
			} catch (err) {
				const durationMs = Math.round(performance.now() - startTime);
				requestCount.add(1, {
					method,
					"http.route": path,
					"http.response.status_code": 500,
				});
				requestDuration.record(durationMs, { method, "http.route": path });

				getRequestLogger().error({ err, durationMs }, "request_error");
				throw err;
			}
		},
	);

	return { requestMiddleware: [requestTracingMiddleware] };
}) as Parameters<typeof createStart>[0]);

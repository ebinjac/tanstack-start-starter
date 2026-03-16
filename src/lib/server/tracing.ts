/**
 * Server function tracing: one log line per action + OTel span with user/business context.
 * Wrap each server function handler with withServerFnTracing("FunctionName", async () => { ... }).
 *
 * Logs: "server_fn_invoked" with serverFn, requestId, userId, adsId (so we see which action ran).
 * Span attributes: server.function.name, user.id, user.ads_id for OTel.
 * Errors are already logged by runWithDb/runMutation (with serverFn in context).
 *
 * Uses dynamic imports so client bundle does not pull in OTel or log.
 */

const SEMATTRS_SERVER_FUNCTION = "server.function.name";
const SEMATTRS_USER_ID = "user.id";
const SEMATTRS_USER_ADS_ID = "user.ads_id";

/**
 * Runs the handler inside a span and logs the server function invocation.
 * Call only from server function handlers. Sets serverFnName on request context
 * so error logs from runWithDb/runMutation include the function name.
 */
export async function withServerFnTracing<T>(
	serverFnName: string,
	fn: () => Promise<T>,
): Promise<T> {
	const [{ getRequestContext, setRequestServerFnName, getRequestLogger }] =
		await Promise.all([import("@/lib/log")]);
	const { context, trace, SpanStatusCode } = await import("@opentelemetry/api");
	const { getOtelTracer } = await import("@/lib/otel");

	setRequestServerFnName(serverFnName);
	const ctx = getRequestContext();
	const tracer = getOtelTracer();
	const span = tracer.startSpan(serverFnName, {
		attributes: {
			[SEMATTRS_SERVER_FUNCTION]: serverFnName,
			...(ctx?.user?.userId != null && { [SEMATTRS_USER_ID]: ctx.user.userId }),
			...(ctx?.user?.adsId != null && { [SEMATTRS_USER_ADS_ID]: ctx.user.adsId }),
		},
	});

	getRequestLogger().info("server_fn_invoked");

	try {
		const result = await context.with(
			trace.setSpan(context.active(), span),
			() => fn(),
		);
		span.setStatus({ code: SpanStatusCode.OK });
		return result;
	} catch (err) {
		span.recordException(err as Error);
		span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error)?.message });
		throw err;
	} finally {
		span.end();
	}
}

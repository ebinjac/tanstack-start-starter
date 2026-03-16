/**
 * Server-only Pino logger and OTel trace correlation.
 * Loaded only when import.meta.env.SSR is true (see logger.ts).
 */

import pino from "pino";
import { getTraceSpanIds } from "@/lib/otel";
import { getRequestContext } from "./request-context";

const LOG_LEVEL =
	(process.env.LOG_LEVEL as pino.Level) || (process.env.NODE_ENV === "production" ? "info" : "debug");
const IS_DEV = process.env.NODE_ENV !== "production";
const OTEL_LOGS_ENABLED = Boolean(process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT);
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? process.env.npm_package_name ?? "ensemble";

function errSerializer(err: unknown): object {
	if (err instanceof Error) {
		const code = "code" in err && typeof (err as { code: unknown }).code === "string"
			? (err as { code: string }).code
			: undefined;
		return {
			message: err.message,
			name: err.name,
			stack: err.stack,
			...(code != null && { code }),
		};
	}
	return { message: String(err) };
}

function buildTransport(): pino.TransportMultiOptions | pino.TransportSingleOptions | undefined {
	const targets: pino.TransportTargetOptions[] = [];

	if (IS_DEV) {
		targets.push({
			target: "pino-pretty",
			options: {
				colorize: true,
				translateTime: "SYS:standard",
				ignore: "pid,hostname",
			},
			level: LOG_LEVEL,
		});
	} else {
		targets.push({
			target: "pino/file",
			options: { destination: 1 },
			level: LOG_LEVEL,
		});
	}

	if (OTEL_LOGS_ENABLED) {
		targets.push({
			target: "pino-opentelemetry-transport",
			options: {
				loggerName: SERVICE_NAME,
				serviceVersion: process.env.OTEL_SERVICE_VERSION ?? "1.0.0",
			},
			level: LOG_LEVEL,
		});
	}

	if (targets.length === 0) return undefined;
	if (targets.length === 1) return { target: targets[0].target, options: targets[0].options };
	return { targets };
}

// When using transport.targets, Pino does not allow custom formatters.level — omit formatters.
const baseOptions: pino.LoggerOptions = {
	level: LOG_LEVEL,
	serializers: { err: errSerializer, error: errSerializer },
	transport: buildTransport(),
};

const rootLogger = pino(baseOptions);

export function getRequestLogger(): pino.Logger {
	const ctx = getRequestContext();
	const traceIds = getTraceSpanIds();
	const bindings: Record<string, unknown> = {
		...(traceIds.traceId && { traceId: traceIds.traceId }),
		...(traceIds.spanId && { spanId: traceIds.spanId }),
	};
	if (ctx) {
		bindings.requestId = ctx.requestId;
		bindings.path = ctx.path;
		bindings.method = ctx.method;
		if (ctx.serverFnName != null) bindings.serverFn = ctx.serverFnName;
		if (ctx.user?.adsId != null) bindings.adsId = ctx.user.adsId;
		if (ctx.user?.userId != null) bindings.userId = ctx.user.userId;
	}
	if (Object.keys(bindings).length > 0) return rootLogger.child(bindings);
	return rootLogger;
}

export function getRootLogger(): pino.Logger {
	return rootLogger;
}

export type { pino as Pino };

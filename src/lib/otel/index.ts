/**
 * OpenTelemetry instrumentation: traces, metrics, and log export configuration.
 *
 * Traces: NodeTracerProvider + OTLP HTTP exporter → otelcolector-dev.com/v1/traces
 * Metrics: MeterProvider + OTLP HTTP exporter → otelcolector-dev.com/v1/metrics
 * Logs: Pino uses pino-opentelemetry-transport (see logger.ts) → otelcolector-dev.com/v1/logs
 *
 * Call initOtel() once at server startup (e.g. top of start.ts) before any other app code.
 */

import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { metrics, trace } from "@opentelemetry/api";
import {
	MeterProvider,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
	BatchSpanProcessor,
	NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";
import { resourceFromAttributes } from "@opentelemetry/resources";

const DEFAULT_OTEL_BASE = "http://localhost:4318";

function getOtelBase(): string {
	return (
		process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.replace(/\/$/, "") ||
		DEFAULT_OTEL_BASE
	);
}

function getServiceName(): string {
	return process.env.OTEL_SERVICE_NAME ?? process.env.npm_package_name ?? "ensemble";
}

let meterProvider: MeterProvider | null = null;
let tracerProvider: NodeTracerProvider | null = null;

/**
 * Initialize OpenTelemetry: trace provider + HTTP instrumentation, and meter provider.
 * Also sets OTEL_EXPORTER_OTLP_LOGS_ENDPOINT so Pino's OTLP transport can send logs.
 * Safe to call multiple times; subsequent calls no-op if already initialized.
 */
export function initOtel(): void {
	if (tracerProvider) return;

	const base = getOtelBase();
	const serviceName = getServiceName();

	// So Pino (pino-opentelemetry-transport) sends logs to the same collector
	if (!process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT) {
		process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT = base;
	}

	const resource = resourceFromAttributes({
		"service.name": serviceName,
	});

	// ─── Traces ─────────────────────────────────────────────────────────────
	const traceExporter = new OTLPTraceExporter({
		url: `${base}/v1/traces`,
	});
	tracerProvider = new NodeTracerProvider({
		resource,
		spanProcessors: [new BatchSpanProcessor(traceExporter)],
	});
	tracerProvider.register();

	registerInstrumentations({
		instrumentations: [
			new HttpInstrumentation({
				ignoreIncomingRequestHook: (req: { url?: string }) => {
					const url = typeof req.url === "string" ? req.url : req.url ?? "";
					return url.includes("/_build") || url.includes("/favicon");
				},
			}),
		],
	});

	// ─── Metrics ────────────────────────────────────────────────────────────
	const metricExporter = new OTLPMetricExporter({
		url: `${base}/v1/metrics`,
	});
	const metricReader = new PeriodicExportingMetricReader({
		exporter: metricExporter,
		exportIntervalMillis: 15_000,
	});
	meterProvider = new MeterProvider({
		resource,
		readers: [metricReader],
	});
	metrics.setGlobalMeterProvider(meterProvider);
}

/**
 * Get the global meter for recording request/server metrics.
 * Call initOtel() first (e.g. from start.ts).
 */
export function getOtelMeter() {
	if (!meterProvider) {
		initOtel();
	}
	return metrics.getMeter(
		getServiceName(),
		process.env.OTEL_SERVICE_VERSION ?? "1.0.0",
	);
}

/**
 * Get the global tracer for creating spans (e.g. server function spans).
 */
export function getOtelTracer() {
	return trace.getTracer(
		getServiceName(),
		process.env.OTEL_SERVICE_VERSION ?? "1.0.0",
	);
}

/**
 * Get traceId and spanId from the current active span for log correlation.
 */
export function getTraceSpanIds(): { traceId?: string; spanId?: string } {
	const span = trace.getActiveSpan();
	if (!span) return {};
	const ctx = span.spanContext();
	return { traceId: ctx.traceId, spanId: ctx.spanId };
}

/**
 * Shutdown exporters (flush and stop). Call on process SIGTERM/SIGINT for clean exit.
 */
export async function shutdownOtel(): Promise<void> {
	const promises: Promise<void>[] = [];
	if (tracerProvider) {
		promises.push(tracerProvider.shutdown());
		tracerProvider = null;
	}
	if (meterProvider) {
		promises.push(meterProvider.shutdown());
		meterProvider = null;
	}
	await Promise.all(promises);
}

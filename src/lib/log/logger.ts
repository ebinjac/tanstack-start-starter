/**
 * Logger: server uses Pino + OTel; client gets no-ops (safe when route tree imports start.ts).
 */

export type Pino = {
	child: () => Pino;
	info: () => void;
	warn: () => void;
	error: () => void;
	debug: () => void;
	trace: () => void;
	fatal: () => void;
};

const noop = () => {};
const noopLogger: Pino = {
	child: () => noopLogger,
	info: noop,
	warn: noop,
	error: noop,
	debug: noop,
	trace: noop,
	fatal: noop,
};

const loggerImpl =
	typeof import.meta.env !== "undefined" && import.meta.env.SSR
		? await import("./logger.server")
		: {
				getRequestLogger: () => noopLogger,
				getRootLogger: () => noopLogger,
			};

export const getRequestLogger = loggerImpl.getRequestLogger;
export const getRootLogger = loggerImpl.getRootLogger;

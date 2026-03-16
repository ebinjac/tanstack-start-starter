/**
 * Request-scoped context for tracing and logging.
 * Server: Node.js AsyncLocalStorage. Client: no-ops (safe when route tree imports start.ts).
 */

export type { RequestContext, RequestContextUser } from "./request-context-types";

function noopGetRequestContext() {
	return undefined;
}
function noopSetRequestUserContext(_user: import("./request-context-types").RequestContextUser) {}
function noopSetRequestServerFnName(_name: string) {}
function noopRunWithRequestContext<T>(_context: import("./request-context-types").RequestContext, fn: () => T): T {
	return fn();
}

const impl =
	typeof import.meta.env !== "undefined" && import.meta.env.SSR
		? await import("./request-context.server")
		: {
				getRequestContext: noopGetRequestContext,
				setRequestUserContext: noopSetRequestUserContext,
				setRequestServerFnName: noopSetRequestServerFnName,
				runWithRequestContext: noopRunWithRequestContext,
			};

export const getRequestContext = impl.getRequestContext;
export const setRequestUserContext = impl.setRequestUserContext;
export const setRequestServerFnName = impl.setRequestServerFnName;
export const runWithRequestContext = impl.runWithRequestContext;

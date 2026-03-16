/**
 * Server-only request context using Node.js AsyncLocalStorage.
 * Do not import this file from client code; use request-context.ts which
 * conditionally loads this or the browser stub.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { RequestContext, RequestContextUser } from "./request-context-types";

const requestStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
	return requestStorage.getStore();
}

export function setRequestUserContext(user: RequestContextUser): void {
	const ctx = requestStorage.getStore();
	if (ctx) ctx.user = user;
}

/** Set current server function name for logs/spans. Used by withServerFnTracing. */
export function setRequestServerFnName(name: string): void {
	const ctx = requestStorage.getStore();
	if (ctx) ctx.serverFnName = name;
}

export function runWithRequestContext<T>(
	context: RequestContext,
	fn: () => T,
): T {
	return requestStorage.run(context, fn);
}

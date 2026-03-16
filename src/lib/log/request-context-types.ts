/**
 * Shared types for request context. No Node/browser-specific imports.
 */

export type RequestContextUser = {
	adsId?: string;
	userId?: string;
};

export type RequestContext = {
	requestId: string;
	method: string;
	path: string;
	startTime: number;
	user?: RequestContextUser;
	/** Current server function name (set by withServerFnTracing) for logs/spans. */
	serverFnName?: string;
};

/**
 * Server-only execution helpers — enterprise pattern for server functions.
 *
 * Pattern:
 * - Auth-required handlers: call `await requireSession()` from @/lib/session first, then
 *   wrap DB work in runMutation (writes) or runWithDb (reads).
 * - Public read handlers: wrap in runWithDb with a fallback (e.g. [] or null).
 * - Mutations: wrap in runMutation so errors are logged and a safe message is thrown.
 *
 * This removes repeated try/catch and session checks from actions. For future
 * TanStack Start server function middleware (createMiddleware), you can add an
 * auth middleware and pass session via context instead of calling requireSession in each handler.
 *
 * Import only inside createServerFn handlers or other server-only code.
 * Use getDbContext() inside handlers to avoid duplicating dynamic imports of db/schema/orm.
 * Logging uses getRequestLogger() so every log line includes requestId when in a request.
 * Logger is imported dynamically to keep server-only code out of the client bundle.
 */

/** Lazy-load db and schema so they stay out of client bundles. Call only inside server handlers. */
export async function getDbContext() {
	const [dbModule, schemaModule] = await Promise.all([
		import("@/db"),
		import("@/db/schema"),
	]);
	const schema = schemaModule.default;
	const orm = {
		eq: schemaModule.eq,
		inArray: schemaModule.inArray,
		gte: schemaModule.gte,
	};
	return { db: dbModule.db, schema, orm };
}

export type RunWithDbOptions<T> = {
	/** Value to return when the operation throws (e.g. [] for list queries). */
	fallback: T;
	/** Optional log prefix (e.g. "[teams]"). */
	logPrefix?: string;
	/** Optional context string for the log (e.g. "Failed to fetch pending requests"). */
	logContext?: string;
};

/**
 * Runs an async operation and returns a fallback value on error. Use for read-only
 * server functions where you want to avoid throwing (e.g. return empty array).
 */
export async function runWithDb<T>(
	fn: () => Promise<T>,
	options: RunWithDbOptions<T>,
): Promise<T> {
	const { fallback, logPrefix = "", logContext = "Operation failed" } = options;
	try {
		return await fn();
	} catch (err) {
		const { getRequestLogger } = await import("@/lib/log");
		getRequestLogger().error(
			{ err, logPrefix, logContext },
			`${logPrefix} ${logContext}`,
		);
		return fallback;
	}
}

export type RunMutationOptions = {
	/** Message shown to the client when the operation throws. */
	errorMessage: string;
	/** Optional log prefix (e.g. "[teams]"). */
	logPrefix?: string;
	/** Optional context string for the log (e.g. "Create team request failed"). */
	logContext?: string;
};

/**
 * Runs an async mutation and on error logs then throws a safe Error. Use for
 * create/update/delete server functions. Preserves err.message when the caught
 * value is an Error, otherwise uses errorMessage.
 */
export async function runMutation<T>(
	fn: () => Promise<T>,
	options: RunMutationOptions,
): Promise<T> {
	const {
		errorMessage,
		logPrefix = "",
		logContext = "Mutation failed",
	} = options;
	try {
		return await fn();
	} catch (err: unknown) {
		const { getRequestLogger } = await import("@/lib/log");
		getRequestLogger().error(
			{ err, logPrefix, logContext },
			`${logPrefix} ${logContext}`,
		);
		const message =
			err instanceof Error ? err.message : errorMessage;
		throw new Error(message);
	}
}

import { useSession } from "@tanstack/react-start/server";
import type { SessionUser } from "@/lib/zod/auth.schema";

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
	console.warn(
		"[session] SESSION_SECRET is missing or too short (needs ≥32 chars). Sessions will not work correctly in production.",
	);
}

/**
 * Server-side session backed by a signed, HTTP-only cookie.
 *
 * Uses TanStack Start's built-in `useSession` which encrypts/signs the
 * cookie payload with `SESSION_SECRET`.  The session data shape matches
 * `SessionUser` from `auth.schema.ts`.
 *
 * Must only be called inside server functions (`createServerFn` handlers).
 */
export function useAppSession() {
	// biome-ignore lint/correctness/useHookAtTopLevel: TanStack Start's useSession is a server API, not a React hook
	return useSession<Partial<SessionUser>>({
		name: "ensemble-session",
		password: SESSION_SECRET ?? "dev-insecure-password-needs-32-chars!!",
		cookie: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax" as const,
			httpOnly: true,
			maxAge: 8 * 60 * 60, // 8 hours
		},
	});
}

/** Session API type for use in auth helpers (e.g. getAppSession). */
export type SessionApi = ReturnType<typeof useAppSession> extends Promise<infer T> ? T : ReturnType<typeof useAppSession>;

/**
 * Returns the session API (for use in auth.fn and other server code that needs
 * to read/update/clear session without requiring auth). Prefer requireSession() in
 * server functions that require an authenticated user.
 */
export async function getAppSession(): Promise<SessionApi> {
	return Promise.resolve(useAppSession());
}

/**
 * Returns the current session or throws "Unauthorized". Use in server function
 * handlers that require an authenticated user. Single place for auth check logic.
 * Also attaches adsId/userId to the request context so logs include user identity.
 *
 * Must only be called inside server functions (`createServerFn` handlers).
 */
export async function requireSession(): Promise<SessionUser> {
	const sessionApi = await getAppSession();
	const data = sessionApi.data;
	if (!data?.userId) {
		throw new Error("Unauthorized");
	}
	const session = data as SessionUser;
	const { setRequestUserContext } = await import("@/lib/log");
	setRequestUserContext({ adsId: session.adsId, userId: session.userId });
	return session;
}

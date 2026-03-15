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

import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createSessionFn, getSessionFn } from "@/actions/auth.fn";
import { useAuthBlueSSO } from "@/hooks";
import type { SessionUser } from "@/lib/zod/auth.schema";

/**
 * AuthGuard bridges the client-side BlueSSO identity into a server-side session.
 *
 * 1. Checks if a valid session already exists (via `getSessionFn`)
 * 2. If not, waits for `useAuthBlueSSO()` to resolve, then calls `createSessionFn`
 * 3. After session creation, invalidates the router so `beforeLoad` re-runs
 *    and `context.session` is populated for all components (including Header/Profile)
 *
 * Place this at the root layout level so it runs once on app load.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
	const ssoUser = useAuthBlueSSO();
	const router = useRouter();
	const [session, setSession] = useState<SessionUser | null>(null);
	const [loading, setLoading] = useState(true);
	const sessionCreationAttempted = useRef(false);

	// Step 1: Check for an existing session on mount
	useEffect(() => {
		let cancelled = false;

		async function checkExistingSession() {
			try {
				const existing = await getSessionFn();
				if (!cancelled && existing) {
					setSession(existing);
				}
			} catch (err) {
				console.error("[AuthGuard] Failed to check session:", err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		checkExistingSession();
		return () => {
			cancelled = true;
		};
	}, []);

	// Step 2: When SSO data resolves and no session exists, create one
	useEffect(() => {
		if (session || !ssoUser || sessionCreationAttempted.current) return;
		sessionCreationAttempted.current = true;

		async function mintSession() {
			try {
				const newSession = await createSessionFn({ data: ssoUser });
				setSession(newSession);
				// Re-run beforeLoad so context.session is available to all components
				await router.invalidate();
			} catch (err) {
				console.error("[AuthGuard] Failed to create session:", err);
			}
		}

		mintSession();
	}, [ssoUser, session, router]);

	// While checking existing session
	if (loading) return null;

	// While waiting for SSO to resolve (no existing session yet)
	if (!session && !ssoUser) return null;

	return <>{children}</>;
}

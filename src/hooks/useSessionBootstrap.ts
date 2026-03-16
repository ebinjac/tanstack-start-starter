import { useRouteContext, useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { createSessionFn } from "@/actions/auth.fn";
import { useAuthBlueSSO } from "@/hooks";

/**
 * Handles session bootstrap: uses session from root context and creates a session
 * when SSO user is present but no session exists. Avoids duplicate getSessionFn
 * (root beforeLoad already runs it).
 */
export function useSessionBootstrap() {
	const { session } = useRouteContext({ from: "__root__" });
	const ssoUser = useAuthBlueSSO();
	const router = useRouter();
	const sessionCreationAttempted = useRef(false);

	useEffect(() => {
		if (session || !ssoUser || sessionCreationAttempted.current) return;
		sessionCreationAttempted.current = true;

		async function mintSession() {
			try {
				await createSessionFn({ data: ssoUser });
				await router.invalidate();
			} catch (err) {
				console.error("[useSessionBootstrap] Failed to create session:", err);
			}
		}

		mintSession();
	}, [session, ssoUser, router]);

	const sessionReady = !!session;
	const waitingForSso = !session && !ssoUser;
	const creatingSession = !session && !!ssoUser;

	return {
		sessionReady,
		waitingForSso,
		creatingSession,
	};
}

import { useSessionBootstrap } from "@/hooks";

/**
 * AuthGuard bridges the client-side BlueSSO identity into a server-side session.
 * Uses useSessionBootstrap to rely on root beforeLoad for session and to create
 * a session when SSO user is present but no session exists.
 *
 * Place this at the root layout level so it runs once on app load.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
	const { sessionReady } = useSessionBootstrap();

	if (!sessionReady) return null;

	return <>{children}</>;
}

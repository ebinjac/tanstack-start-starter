import { createServerFn } from "@tanstack/react-start";
import type { SessionUser } from "@/lib/zod/auth.schema";
import { ssoUserSchema } from "@/lib/zod/auth.schema";

// ─── Resolve team memberships from SSO groups ─────────────────────────────────
// Kept as a local helper, only called inside server function handlers.
// Wrapped in try/catch so session creation still works if DB is unavailable.

async function resolveTeamMemberships(groups: string[]): Promise<{
	accessibleTeamIds: string[];
	adminTeamIds: string[];
}> {
	try {
		const { db } = await import("@/db");
		const { teams } = await import("@/db/schema");
		const { eq } = await import("drizzle-orm");

		const allTeams = await db
			.select({
				id: teams.id,
				userGroup: teams.userGroup,
				adminGroup: teams.adminGroup,
			})
			.from(teams)
			.where(eq(teams.isActive, true));

		const accessibleTeamIds: string[] = [];
		const adminTeamIds: string[] = [];

		for (const team of allTeams) {
			const isAdmin = groups.includes(team.adminGroup);
			const isUser = groups.includes(team.userGroup);

			if (isAdmin) {
				adminTeamIds.push(team.id);
				accessibleTeamIds.push(team.id);
			} else if (isUser) {
				accessibleTeamIds.push(team.id);
			}
		}

		return { accessibleTeamIds, adminTeamIds };
	} catch (err) {
		console.error("[auth] Failed to resolve team memberships:", err);
		return { accessibleTeamIds: [], adminTeamIds: [] };
	}
}

async function getAppSession() {
	const { useAppSession } = await import("@/lib/session");
	// biome-ignore lint/correctness/useHookAtTopLevel: TanStack Start's useSession is a server API, not a React hook
	return useAppSession();
}

// ─── createSessionFn ──────────────────────────────────────────────────────────
// Called from the client after BlueSSO resolves.
// Validates the SSO payload, resolves memberships, mints a session cookie.

export const createSessionFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => {
		return ssoUserSchema.parse(data);
	})
	.handler(async ({ data }) => {
		const { attributes, groups } = data;
		const { accessibleTeamIds, adminTeamIds } =
			await resolveTeamMemberships(groups);

		const now = Math.floor(Date.now() / 1000);
		const sessionData: SessionUser = {
			userId: attributes.guid,
			adsId: attributes.adsId,
			email: attributes.email,
			fullName: attributes.fullName,
			employeeId: attributes.employeeId,
			groups,
			accessibleTeamIds,
			adminTeamIds,
			iat: now,
			exp: now + 8 * 60 * 60, // 8 hours
		};

		const session = await getAppSession();
		await session.update(sessionData);

		return sessionData;
	});

// ─── getSessionFn ─────────────────────────────────────────────────────────────
// Reads and returns the current session from the cookie.
// Returns null if no session exists or if expired.

export const getSessionFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const session = await getAppSession();

		if (!session.data.userId) {
			return null;
		}

		// Check expiration
		const now = Math.floor(Date.now() / 1000);
		if (session.data.exp && session.data.exp < now) {
			await session.clear();
			return null;
		}

		return session.data as SessionUser;
	},
);

// ─── refreshSessionFn ─────────────────────────────────────────────────────────
// Re-resolves team memberships from DB using stored groups.
// Call this when you suspect a user's group membership may have changed.

export const refreshSessionFn = createServerFn({ method: "POST" }).handler(
	async () => {
		const session = await getAppSession();

		if (!session.data.userId || !session.data.groups) {
			return null;
		}

		const { accessibleTeamIds, adminTeamIds } = await resolveTeamMemberships(
			session.data.groups,
		);

		const now = Math.floor(Date.now() / 1000);
		const refreshedData: SessionUser = {
			userId: session.data.userId,
			adsId: session.data.adsId ?? "",
			email: session.data.email ?? "",
			fullName: session.data.fullName ?? "",
			employeeId: session.data.employeeId ?? "",
			groups: session.data.groups,
			accessibleTeamIds,
			adminTeamIds,
			iat: now,
			exp: now + 8 * 60 * 60,
		};

		await session.update(refreshedData);
		return refreshedData;
	},
);

// ─── clearSessionFn ───────────────────────────────────────────────────────────
// Clears the session cookie.

export const clearSessionFn = createServerFn({ method: "POST" }).handler(
	async () => {
		const session = await getAppSession();
		await session.clear();
		return { success: true };
	},
);

import { createServerFn } from "@tanstack/react-start";
import type { SessionUser } from "@/lib/zod/auth.schema";
import { ssoUserSchema } from "@/lib/zod/auth.schema";
import { getAppSession } from "@/lib/session";
import { getDbContext, runWithDb } from "@/lib/server/run";
import { withServerFnTracing } from "@/lib/server/tracing";

const LOG_PREFIX = "[auth]";

/** Resolve team memberships from SSO groups. Returns empty ids if DB fails so session creation can still succeed. */
async function resolveTeamMemberships(groups: string[]): Promise<{
	accessibleTeamIds: string[];
	adminTeamIds: string[];
}> {
	return runWithDb(
		async () => {
			const { db, schema, orm } = await getDbContext();
			const { teams } = schema;
			const { eq } = orm;

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
		},
		{
			fallback: { accessibleTeamIds: [], adminTeamIds: [] },
			logPrefix: LOG_PREFIX,
			logContext: "Failed to resolve team memberships",
		},
	);
}

// ─── createSessionFn ──────────────────────────────────────────────────────────
// Called from the client after BlueSSO resolves.
// Validates the SSO payload, resolves memberships, mints a session cookie.

export const createSessionFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => {
		return ssoUserSchema.parse(data);
	})
	.handler(async ({ data }) =>
		withServerFnTracing("createSessionFn", async () => {
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

			const sessionApi = await getAppSession();
			await sessionApi.update(sessionData);

			const { setRequestUserContext } = await import("@/lib/log");
			setRequestUserContext({ adsId: sessionData.adsId, userId: sessionData.userId });

			return sessionData;
		}),
	);

// ─── getSessionFn ─────────────────────────────────────────────────────────────
// Reads and returns the current session from the cookie.
// Returns null if no session exists or if expired.

export const getSessionFn = createServerFn({ method: "GET" }).handler(() =>
	withServerFnTracing("getSessionFn", async () => {
		const sessionApi = await getAppSession();
		const data = sessionApi.data;

		if (!data?.userId) return null;

		const now = Math.floor(Date.now() / 1000);
		if (data.exp != null && data.exp < now) {
			await sessionApi.clear();
			return null;
		}

		const session = data as SessionUser;
		const { setRequestUserContext } = await import("@/lib/log");
		setRequestUserContext({ adsId: session.adsId, userId: session.userId });

		return session;
	}),
);

// ─── refreshSessionFn ─────────────────────────────────────────────────────────
// Re-resolves team memberships from DB using stored groups.
// Call this when you suspect a user's group membership may have changed.

export const refreshSessionFn = createServerFn({ method: "POST" }).handler(() =>
	withServerFnTracing("refreshSessionFn", async () => {
		const sessionApi = await getAppSession();
		const data = sessionApi.data;

		if (!data?.userId || !data.groups) return null;

		const { accessibleTeamIds, adminTeamIds } = await resolveTeamMemberships(
			data.groups,
		);

		const now = Math.floor(Date.now() / 1000);
		const refreshedData: SessionUser = {
			userId: data.userId,
			adsId: data.adsId ?? "",
			email: data.email ?? "",
			fullName: data.fullName ?? "",
			employeeId: data.employeeId ?? "",
			groups: data.groups,
			accessibleTeamIds,
			adminTeamIds,
			iat: now,
			exp: now + 8 * 60 * 60,
		};

		await sessionApi.update(refreshedData);

		const { setRequestUserContext } = await import("@/lib/log");
		setRequestUserContext({ adsId: refreshedData.adsId, userId: refreshedData.userId });

		return refreshedData;
	}),
);

// ─── clearSessionFn ───────────────────────────────────────────────────────────
// Clears the session cookie.

export const clearSessionFn = createServerFn({ method: "POST" }).handler(() =>
	withServerFnTracing("clearSessionFn", async () => {
		const sessionApi = await getAppSession();
		await sessionApi.clear();
		return { success: true };
	}),
);

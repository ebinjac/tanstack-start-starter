import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { createTeamRequestSchema } from "@/lib/zod/team";

export const getTeamsByIdsFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.array(z.string()).parse(data))
	.handler(async ({ data: ids }) => {
		if (!ids || ids.length === 0) return [];
		
		try {
			const { db } = await import("@/db");
			const { teams } = await import("@/db/schema");
			const { inArray } = await import("drizzle-orm");

			const results = await db
				.select({
					id: teams.id,
					teamName: teams.teamName,
					userGroup: teams.userGroup,
					adminGroup: teams.adminGroup,
					contactName: teams.contactName,
					contactEmail: teams.contactEmail,
					isActive: teams.isActive,
				})
				.from(teams)
				.where(inArray(teams.id, ids));

			return results;
		} catch (err) {
			console.error("[teams] Failed to fetch teams by ids:", err);
			return [];
		}
	});

export const checkTeamNameFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: name }) => {
		if (!name || name.trim().length === 0) return { isAvailable: true };

		try {
			const { db } = await import("@/db");
			const { teams } = await import("@/db/schema");
			const { eq } = await import("drizzle-orm");

			const existing = await db
				.select({ id: teams.id })
				.from(teams)
				.where(eq(teams.teamName, name))
				.limit(1);

			return { isAvailable: existing.length === 0 };
		} catch (err) {
			console.error("[teams] Failed to check team name:", err);
			return { isAvailable: false };
		}
	});

export const createTeamRequestFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createTeamRequestSchema.parse(data))
	.handler(async ({ data }) => {
		const { useAppSession } = await import("@/lib/session");
		const session = await useAppSession();

		if (!session.data.userId) {
			throw new Error("Unauthorized");
		}

		try {
			const { db } = await import("@/db");
			const { teamRegistrationRequests, teams } = await import("@/db/schema");
			const { eq } = await import("drizzle-orm");

			// Check again on server
			const existing = await db
				.select({ id: teams.id })
				.from(teams)
				.where(eq(teams.teamName, data.teamName))
				.limit(1);

			if (existing.length > 0) {
				throw new Error("Team Name already taken.");
			}

			const inserted = await db.insert(teamRegistrationRequests).values({
				teamName: data.teamName,
				userGroup: data.userGroup,
				adminGroup: data.adminGroup,
				contactName: data.contactName,
				contactEmail: data.contactEmail,
				requestedBy: session.data.email ?? session.data.userId,
				status: "pending",
			}).returning({ id: teamRegistrationRequests.id });

			return { success: true, requestId: inserted[0].id };
		} catch (err: any) {
			console.error("[teams] Failed to create team request:", err);
			throw new Error(err.message || "Failed to submit request.");
		}
	});

export const getPendingTeamRequestsFn = createServerFn({ method: "GET" })
	.handler(async () => {
		try {
			const { db } = await import("@/db");
			const { teamRegistrationRequests } = await import("@/db/schema");
			const { eq } = await import("drizzle-orm");

			return await db
				.select()
				.from(teamRegistrationRequests)
				.where(eq(teamRegistrationRequests.status, "pending"));
		} catch (err) {
			console.error("[teams] Failed to fetch pending requests:", err);
			return [];
		}
	});

export const getAllTeamsAdminFn = createServerFn({ method: "GET" })
	.handler(async () => {
		try {
			const { db } = await import("@/db");
			const { teams } = await import("@/db/schema");

			return await db.select().from(teams);
		} catch (err) {
			console.error("[teams] Failed to fetch all teams:", err);
			return [];
		}
	});

export const getTeamRequestByIdFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: id }) => {
		try {
			const { db } = await import("@/db");
			const { teamRegistrationRequests } = await import("@/db/schema");
			const { eq } = await import("drizzle-orm");

			const result = await db
				.select()
				.from(teamRegistrationRequests)
				.where(eq(teamRegistrationRequests.id, id))
				.limit(1);

			return result[0] || null;
		} catch (err) {
			console.error("[teams] Failed to fetch request by id:", err);
			return null;
		}
	});

export const getMyTeamRequestsFn = createServerFn({ method: "GET" })
	.handler(async () => {
		const { useAppSession } = await import("@/lib/session");
		const session = await useAppSession();

		if (!session.data.userId) {
			throw new Error("Unauthorized");
		}

		try {
			const { db } = await import("@/db");
			const { teamRegistrationRequests } = await import("@/db/schema");
			const { eq } = await import("drizzle-orm");

			return await db
				.select()
				.from(teamRegistrationRequests)
				.where(eq(teamRegistrationRequests.requestedBy, session.data.email ?? session.data.userId));
		} catch (err) {
			console.error("[teams] Failed to fetch my requests:", err);
			return [];
		}
	});

export const approveTeamRequestFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) =>
		z.object({ requestId: z.string(), comments: z.string().optional() }).parse(data),
	)
	.handler(async ({ data }) => {
		const { useAppSession } = await import("@/lib/session");
		const session = await useAppSession();

		if (!session.data.userId) {
			throw new Error("Unauthorized");
		}

		try {
			const { db } = await import("@/db");
			const { teamRegistrationRequests, teams } = await import("@/db/schema/teams");
			const { eq } = await import("drizzle-orm");

			const [request] = await db
				.select()
				.from(teamRegistrationRequests)
				.where(eq(teamRegistrationRequests.id, data.requestId))
				.limit(1);

			if (!request) throw new Error("Request not found");
			if (request.status !== "pending") throw new Error("Request already processed");

			await db.transaction(async (tx) => {
				await tx
					.update(teamRegistrationRequests)
					.set({
						status: "approved",
						reviewedBy: session.data.email ?? session.data.userId,
						reviewedAt: new Date(),
						comments: data.comments ?? null,
					})
					.where(eq(teamRegistrationRequests.id, data.requestId));

				await tx.insert(teams).values({
					teamName: request.teamName,
					userGroup: request.userGroup,
					adminGroup: request.adminGroup,
					contactName: request.contactName,
					contactEmail: request.contactEmail,
					createdBy: session.data.email ?? session.data.userId,
				});
			});

			return { success: true };
		} catch (err: any) {
			console.error("[teams] Approve failed:", err);
			throw new Error(err.message || "Approval failed.");
		}
	});

export const rejectTeamRequestFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) =>
		z.object({ requestId: z.string(), comments: z.string() }).parse(data),
	)
	.handler(async ({ data }) => {
		const { useAppSession } = await import("@/lib/session");
		const session = await useAppSession();

		if (!session.data.userId) {
			throw new Error("Unauthorized");
		}

		try {
			const { db } = await import("@/db");
			const { teamRegistrationRequests } = await import("@/db/schema/teams");
			const { eq } = await import("drizzle-orm");

			await db
				.update(teamRegistrationRequests)
				.set({
					status: "rejected",
					reviewedBy: session.data.email ?? session.data.userId,
					reviewedAt: new Date(),
					comments: data.comments,
				})
				.where(eq(teamRegistrationRequests.id, data.requestId));

			return { success: true };
		} catch (err: any) {
			console.error("[teams] Reject failed:", err);
			throw new Error(err.message || "Rejection failed.");
		}
	});

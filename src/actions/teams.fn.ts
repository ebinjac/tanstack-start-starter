import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSession } from "@/lib/session";
import { runMutation, runWithDb } from "@/lib/server/run";
import { withServerFnTracing } from "@/lib/server/tracing";
import { createTeamRequestSchema } from "@/lib/zod/team";

const LOG_PREFIX = "[teams]";

export const getTeamsByIdsFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.array(z.string()).parse(data))
	.handler(async ({ data: ids }) =>
		withServerFnTracing("getTeamsByIdsFn", async () => {
			if (!ids || ids.length === 0) return [];

			return runWithDb(
			async () => {
				const { db } = await import("@/db");
				const { teams } = await import("@/db/schema");
				const { inArray } = await import("drizzle-orm");
				return db
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
			},
			{
				fallback: [],
				logPrefix: LOG_PREFIX,
				logContext: "Failed to fetch teams by ids",
			},
		);
		}),
	);

export const checkTeamNameFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(async ({ data: name }) =>
		withServerFnTracing("checkTeamNameFn", async () => {
			if (!name || name.trim().length === 0) return { isAvailable: true };

			return runWithDb(
			async () => {
				const { db } = await import("@/db");
				const { teams } = await import("@/db/schema");
				const { eq } = await import("drizzle-orm");
				const existing = await db
					.select({ id: teams.id })
					.from(teams)
					.where(eq(teams.teamName, name))
					.limit(1);
				return { isAvailable: existing.length === 0 };
			},
			{
				fallback: { isAvailable: false },
				logPrefix: LOG_PREFIX,
				logContext: "Failed to check team name",
			},
		);
		}),
	);

export const createTeamRequestFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => createTeamRequestSchema.parse(data))
	.handler(async ({ data }) =>
		withServerFnTracing("createTeamRequestFn", async () => {
			const session = await requireSession();

			return runMutation(
			async () => {
				const { db } = await import("@/db");
				const { teamRegistrationRequests, teams } = await import("@/db/schema");
				const { eq } = await import("drizzle-orm");

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
					requestedBy: session.email ?? session.userId,
					status: "pending",
				}).returning({ id: teamRegistrationRequests.id });

				return { success: true, requestId: inserted[0].id };
			},
			{
				errorMessage: "Failed to submit request.",
				logPrefix: LOG_PREFIX,
				logContext: "Failed to create team request",
			},
		);
		}),
	);

export const getPendingTeamRequestsFn = createServerFn({ method: "GET" })
	.handler(() =>
		withServerFnTracing("getPendingTeamRequestsFn", () =>
			runWithDb(
			async () => {
				const { db } = await import("@/db");
				const { teamRegistrationRequests } = await import("@/db/schema");
				const { eq } = await import("drizzle-orm");
				return db
					.select()
					.from(teamRegistrationRequests)
					.where(eq(teamRegistrationRequests.status, "pending"));
			},
			{
				fallback: [],
				logPrefix: LOG_PREFIX,
				logContext: "Failed to fetch pending requests",
			},
		),
		),
	);

export const getAllTeamsAdminFn = createServerFn({ method: "GET" })
	.handler(() =>
		withServerFnTracing("getAllTeamsAdminFn", () =>
			runWithDb(
			async () => {
				const { db } = await import("@/db");
				const { teams } = await import("@/db/schema");
				return db.select().from(teams);
			},
			{
				fallback: [],
				logPrefix: LOG_PREFIX,
				logContext: "Failed to fetch all teams",
			},
		),
		),
	);

export type RequestStatsByDay = {
	date: string;
	requests: number;
	pending: number;
	approved: number;
	rejected: number;
};

export type RequestStatsForDashboard = {
	byDay: RequestStatsByDay[];
	statusCounts: { pending: number; approved: number; rejected: number; processed: number };
};

const EMPTY_STATS: RequestStatsForDashboard = {
	byDay: Array.from({ length: 14 }, (_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (13 - i));
		return {
			date: d.toISOString().slice(0, 10),
			requests: 0,
			pending: 0,
			approved: 0,
			rejected: 0,
		};
	}),
	statusCounts: { pending: 0, approved: 0, rejected: 0, processed: 0 },
};

export const getRequestStatsForDashboardFn = createServerFn({ method: "GET" })
	.handler((): Promise<RequestStatsForDashboard> =>
		withServerFnTracing("getRequestStatsForDashboardFn", () =>
			runWithDb(
			async () => {
				const { db } = await import("@/db");
				const { teamRegistrationRequests } = await import("@/db/schema");
				const { gte } = await import("drizzle-orm");

				const fourteenDaysAgo = new Date();
				fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

				const rows = await db
					.select({
						requestedAt: teamRegistrationRequests.requestedAt,
						status: teamRegistrationRequests.status,
					})
					.from(teamRegistrationRequests)
					.where(gte(teamRegistrationRequests.requestedAt, fourteenDaysAgo));

				const statusCounts = { pending: 0, approved: 0, rejected: 0, processed: 0 };
				const byDayMap = new Map<string, { pending: number; approved: number; rejected: number; processed: number }>();

				for (const r of rows) {
					const dateStr = r.requestedAt ? new Date(r.requestedAt).toISOString().slice(0, 10) : "";
					if (!dateStr) continue;
					const status = r.status as keyof typeof statusCounts;
					if (status in statusCounts) statusCounts[status] += 1;

					let dayEntry = byDayMap.get(dateStr);
					if (!dayEntry) {
						dayEntry = { pending: 0, approved: 0, rejected: 0, processed: 0 };
						byDayMap.set(dateStr, dayEntry);
					}
					if (status in dayEntry) dayEntry[status] += 1;
				}

				const byDay: RequestStatsByDay[] = [];
				for (let i = 13; i >= 0; i--) {
					const d = new Date();
					d.setDate(d.getDate() - i);
					const dateStr = d.toISOString().slice(0, 10);
					const entry = byDayMap.get(dateStr) ?? { pending: 0, approved: 0, rejected: 0, processed: 0 };
					byDay.push({
						date: dateStr,
						requests: entry.pending + entry.approved + entry.rejected + entry.processed,
						pending: entry.pending,
						approved: entry.approved,
						rejected: entry.rejected,
					});
				}

				return { byDay, statusCounts };
			},
			{
				fallback: EMPTY_STATS,
				logPrefix: LOG_PREFIX,
				logContext: "Failed to fetch request stats",
			},
		),
		),
	);

export const getTeamRequestByIdFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) => z.string().parse(data))
	.handler(({ data: id }) =>
		withServerFnTracing("getTeamRequestByIdFn", () =>
			runWithDb(
			async () => {
				const { db } = await import("@/db");
				const { teamRegistrationRequests } = await import("@/db/schema");
				const { eq } = await import("drizzle-orm");
				const result = await db
					.select()
					.from(teamRegistrationRequests)
					.where(eq(teamRegistrationRequests.id, id))
					.limit(1);
				return result[0] ?? null;
			},
			{
				fallback: null,
				logPrefix: LOG_PREFIX,
				logContext: "Failed to fetch request by id",
			},
		),
		),
	);

export const getMyTeamRequestsFn = createServerFn({ method: "GET" })
	.handler(() =>
		withServerFnTracing("getMyTeamRequestsFn", async () => {
			const session = await requireSession();
			return runWithDb(
			async () => {
				const { db } = await import("@/db");
				const { teamRegistrationRequests } = await import("@/db/schema");
				const { eq } = await import("drizzle-orm");
				return db
					.select()
					.from(teamRegistrationRequests)
					.where(eq(teamRegistrationRequests.requestedBy, session.email ?? session.userId));
			},
			{
				fallback: [],
				logPrefix: LOG_PREFIX,
				logContext: "Failed to fetch my requests",
			},
		);
		}),
	);

export const approveTeamRequestFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) =>
		z.object({ requestId: z.string(), comments: z.string().optional() }).parse(data),
	)
	.handler(async ({ data }) =>
		withServerFnTracing("approveTeamRequestFn", async () => {
			const session = await requireSession();
			const createdBy = session.email ?? session.userId;
			if (!createdBy) throw new Error("Unauthorized");

			return runMutation(
			async () => {
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
							reviewedBy: createdBy,
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
						createdBy,
					});
				});

				return { success: true };
			},
			{
				errorMessage: "Approval failed.",
				logPrefix: LOG_PREFIX,
				logContext: "Approve failed",
			},
		);
		}),
	);

export const rejectTeamRequestFn = createServerFn({ method: "POST" })
	.inputValidator((data: unknown) =>
		z.object({ requestId: z.string(), comments: z.string() }).parse(data),
	)
	.handler(async ({ data }) =>
		withServerFnTracing("rejectTeamRequestFn", async () => {
			const session = await requireSession();

			return runMutation(
			async () => {
				const { db } = await import("@/db");
				const { teamRegistrationRequests } = await import("@/db/schema/teams");
				const { eq } = await import("drizzle-orm");

				await db
					.update(teamRegistrationRequests)
					.set({
						status: "rejected",
						reviewedBy: session.email ?? session.userId,
						reviewedAt: new Date(),
						comments: data.comments,
					})
					.where(eq(teamRegistrationRequests.id, data.requestId));

				return { success: true };
			},
			{
				errorMessage: "Rejection failed.",
				logPrefix: LOG_PREFIX,
				logContext: "Reject failed",
			},
		);
		}),
	);

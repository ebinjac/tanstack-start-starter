import { Card } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Clock, TrendingUp, Users } from "lucide-react";
import {
	Bar,
	BarChart as RechartsBarChart,
	CartesianGrid,
	XAxis,
	YAxis,
} from "recharts";
import { allTeamsQueryOptions, pendingRequestsQueryOptions, requestStatsQueryOptions } from "../admin";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const requestsChartConfig = {
	requests: {
		label: "Requests",
		color: "var(--chart-1)",
	},
	pending: {
		label: "Pending",
		color: "var(--chart-2)",
	},
	approved: {
		label: "Approved",
		color: "var(--chart-3)",
	},
	rejected: {
		label: "Rejected",
		color: "var(--chart-4)",
	},
} satisfies ChartConfig;

export const Route = createFileRoute("/admin/")({
	component: DashboardView,
});

function DashboardView() {
	const { data: pendingRequests } = useSuspenseQuery(
		pendingRequestsQueryOptions(),
	);
	const { data: allTeams } = useSuspenseQuery(allTeamsQueryOptions());
	const { data: requestStats } = useSuspenseQuery(requestStatsQueryOptions());

	const chartData = requestStats.byDay.map((d) => ({
		...d,
		date: new Date(d.date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
	}));

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h1 className="text-3xl font-black tracking-tight">
					Dashboard Overview
				</h1>
				<p className="text-muted text-sm mt-1">
					Review metrics, request volume, and pending operations.
				</p>
			</div>

			{/* Stat cards */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
				<Card
					variant="secondary"
					className="border border-border/40 p-6 shadow-sm"
				>
					<div className="flex flex-row items-center justify-between">
						<div>
							<p className="text-muted text-sm font-semibold">
								Total Teams
							</p>
							<h2 className="text-3xl font-black tracking-tight mt-1">
								{allTeams.length}
							</h2>
						</div>
						<div className="rounded-2xl bg-accent/10 p-4 text-accent">
							<Users className="size-8" />
						</div>
					</div>
				</Card>

				<Card
					variant="secondary"
					className="border border-border/40 p-6 shadow-sm"
				>
					<div className="flex flex-row items-center justify-between">
						<div>
							<p className="text-muted text-sm font-semibold">
								Pending Requests
							</p>
							<h2 className="text-3xl font-black tracking-tight mt-1">
								{pendingRequests.length}
							</h2>
						</div>
						<div className="rounded-2xl bg-danger/10 p-4 text-danger">
							<Clock className="size-8" />
						</div>
					</div>
				</Card>

				<Card
					variant="secondary"
					className="border border-border/40 p-6 shadow-sm"
				>
					<div className="flex flex-row items-center justify-between">
						<div>
							<p className="text-muted text-sm font-semibold">
								Approved (14d)
							</p>
							<h2 className="text-3xl font-black tracking-tight mt-1">
								{requestStats.statusCounts.approved}
							</h2>
						</div>
						<div className="rounded-2xl bg-success/10 p-4 text-success">
							<TrendingUp className="size-8" />
						</div>
					</div>
				</Card>

				<Card
					variant="secondary"
					className="border border-border/40 p-6 shadow-sm"
				>
					<div className="flex flex-row items-center justify-between">
						<div>
							<p className="text-muted text-sm font-semibold">
								Total Requests (14d)
							</p>
							<h2 className="text-3xl font-black tracking-tight mt-1">
								{requestStats.byDay.reduce(
									(sum, d) => sum + d.requests,
									0
								)}
							</h2>
						</div>
						<div className="rounded-2xl bg-primary/10 p-4 text-primary">
							<BarChart3 className="size-8" />
						</div>
					</div>
				</Card>
			</div>

			{/* Requests over time chart */}
			<Card
				variant="secondary"
				className="border border-border/40 overflow-hidden shadow-sm"
			>
				<Card.Header className="border-b border-border/40 px-6 py-4">
					<Card.Title className="text-lg font-semibold">
						Requests over time
					</Card.Title>
					<Card.Description className="text-muted text-sm">
						Team registration requests in the last 14 days
					</Card.Description>
				</Card.Header>
				<Card.Content className="p-6">
					<ChartContainer
						config={requestsChartConfig}
						className={cn("w-full")}
					>
						<RechartsBarChart
							data={chartData}
							margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								className="stroke-border/50"
							/>
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(v) => String(v)}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										indicator="dot"
										labelFormatter={(value) => value}
									/>
								}
								cursor={{ fill: "var(--muted)", opacity: 0.3 }}
							/>
							<Bar
								dataKey="requests"
								fill="var(--color-requests)"
								radius={[4, 4, 0, 0]}
							/>
						</RechartsBarChart>
					</ChartContainer>
				</Card.Content>
			</Card>

			{/* Status breakdown card */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
				<Card
					variant="secondary"
					className="border border-border/40 p-5 shadow-sm"
				>
					<p className="text-muted text-sm font-semibold">
						Pending
					</p>
					<p className="text-2xl font-bold text-warning mt-1">
						{requestStats.statusCounts.pending}
					</p>
				</Card>
				<Card
					variant="secondary"
					className="border border-border/40 p-5 shadow-sm"
				>
					<p className="text-muted text-sm font-semibold">
						Approved
					</p>
					<p className="text-2xl font-bold text-success mt-1">
						{requestStats.statusCounts.approved}
					</p>
				</Card>
				<Card
					variant="secondary"
					className="border border-border/40 p-5 shadow-sm"
				>
					<p className="text-muted text-sm font-semibold">
						Rejected
					</p>
					<p className="text-2xl font-bold text-danger mt-1">
						{requestStats.statusCounts.rejected}
					</p>
				</Card>
			</div>
		</div>
	);
}

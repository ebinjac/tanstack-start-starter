import { Card } from "@heroui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Users } from "lucide-react";
import { allTeamsQueryOptions, pendingRequestsQueryOptions } from "../admin";

export const Route = createFileRoute("/admin/")({
	loader: ({ context }) => {
		context.queryClient.prefetchQuery(pendingRequestsQueryOptions());
		context.queryClient.prefetchQuery(allTeamsQueryOptions());
	},
	component: DashboardView,
});

function DashboardView() {
	const { data: pendingRequests } = useSuspenseQuery(
		pendingRequestsQueryOptions(),
	);
	const { data: allTeams } = useSuspenseQuery(allTeamsQueryOptions());

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-3xl font-black tracking-tight">
					Dashboard Overview
				</h1>
				<p className="text-muted text-sm">
					Review metrics and pending operations.
				</p>
			</div>
			
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
				<Card className="p-6 flex flex-row items-center justify-between border border-border/40 shadow-smooth">
					<div>
						<p className="text-muted text-sm font-semibold">Total Teams</p>
						<h2 className="text-4xl font-black tracking-tight mt-1">
							{allTeams.length}
						</h2>
					</div>
					<div className="p-4 rounded-2xl bg-accent/10 text-accent">
						<Users className="size-8" />
					</div>
				</Card>

				<Card className="p-6 flex flex-row items-center justify-between border border-border/40 shadow-smooth">
					<div>
						<p className="text-muted text-sm font-semibold">Pending Requests</p>
						<h2 className="text-4xl font-black tracking-tight mt-1">
							{pendingRequests.length}
						</h2>
					</div>
					<div className="p-4 rounded-2xl bg-danger/10 text-danger">
						<Clock className="size-8" />
					</div>
				</Card>
			</div>
		</div>
	);
}

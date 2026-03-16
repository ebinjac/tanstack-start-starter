import type { TeamRegistrationRequest } from "@/db/schema";
import { Button, Separator, Surface } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getMyTeamRequestsFn } from "@/actions/teams.fn";
import { StatusBadge } from "@/components/ui/status-badge";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/profile/requests")({
	beforeLoad: ({ context }) => {
		if (!context.session) {
			throw redirect({ to: "/" });
		}
	},
	loader: ({ context }) => {
		context.queryClient.prefetchQuery({
			queryKey: queryKeys.teams.myRequests(),
			queryFn: () => getMyTeamRequestsFn(),
		});
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data: requests = [], isLoading } = useQuery({
		queryKey: queryKeys.teams.myRequests(),
		queryFn: () => getMyTeamRequestsFn(),
	});

	return (
		<div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div className="flex flex-col gap-1">
					<h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
						My Team Requests
					</h1>
					<p className="text-muted text-sm">
						Track the status of team workspaces you have submitted for
						registration.
					</p>
				</div>
				<Link to="/profile">
					<Button
						variant="outline"
						className="p-1 px-3 text-muted hover:text-foreground text-sm flex items-center gap-1 cursor-pointer rounded-lg h-9"
					>
						<ArrowLeft className="size-4" /> Back to Profile
					</Button>
				</Link>
			</div>

			<Separator className="border-border/10" />

			{isLoading ? (
				<div className="py-20 text-center text-muted animate-pulse">
					Loading your requests...
				</div>
			) : requests.length === 0 ? (
				<div className="py-20 text-center flex flex-col items-center gap-3">
					<p className="text-muted text-sm italic">
						You have not submitted any team requests.
					</p>
					<Link to="/teams/create">
						<Button className="font-bold bg-accent text-white hover:bg-accent/90 rounded-xl h-10 px-5">
							Create a Team
						</Button>
					</Link>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4">
					{(requests as TeamRegistrationRequest[]).map((req) => (
						<Surface
							key={req.id}
							className="p-5 backdrop-blur-md rounded-2xl border border-border/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-border/60 hover:bg-muted/5 transition-all"
						>
							<div className="flex flex-col gap-1 flex-1">
								<h3 className="font-bold text-lg text-foreground tracking-tight">
									{req.teamName}
								</h3>
								<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
									<span>
										User Group:{" "}
										<span className="font-semibold text-foreground/80">
											{req.userGroup}
										</span>
									</span>
									<span>
										Admin Group:{" "}
										<span className="font-semibold text-foreground/80">
											{req.adminGroup}
										</span>
									</span>
								</div>
								<span className="text-[10px] text-muted mt-1">
									Submitted on:{" "}
									{req.createdAt
										? new Date(req.createdAt).toLocaleDateString()
										: "N/A"}
								</span>
							</div>

							<div className="flex items-center gap-3 shrink-0">
								<StatusBadge
									status={
										req.status === "processed" ? "approved" : req.status
									}
								/>
								<Link
									to="/teams/requests/$requestId"
									params={{ requestId: req.id }}
								>
									<Button
										size="sm"
										variant="secondary"
										className="font-semibold rounded-lg text-xs h-8 px-3 active:scale-95 transition-all text-foreground/80"
									>
										View Details
									</Button>
								</Link>
							</div>
						</Surface>
					))}
				</div>
			)}
		</div>
	);
}

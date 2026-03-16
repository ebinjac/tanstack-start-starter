import type { TeamRegistrationRequest } from "@/db/schema";
import { Button, Label, Surface } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getTeamRequestByIdFn } from "@/actions/teams.fn";
import { StatusBadge } from "@/components/ui/status-badge";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/teams/requests/$requestId")({
	loader: async ({ context, params }) => {
		context.queryClient.prefetchQuery({
			queryKey: queryKeys.teams.requestById(params.requestId),
			queryFn: () => getTeamRequestByIdFn({ data: params.requestId }),
		});
		return { requestId: params.requestId };
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { requestId } = Route.useLoaderData();

	const { data: request, isLoading } = useQuery({
		queryKey: queryKeys.teams.requestById(requestId),
		queryFn: () => getTeamRequestByIdFn({ data: requestId }),
	});

	if (isLoading) {
		return (
			<div className="max-w-xl mx-auto px-4 py-32 text-center text-muted animate-pulse">
				Loading request details...
			</div>
		);
	}

	if (!request) {
		return (
			<div className="max-w-xl mx-auto px-4 py-32 text-center text-danger font-semibold">
				Request not found.
			</div>
		);
	}

	const req = request as TeamRegistrationRequest;

	return (
		<div className="max-w-xl mx-auto px-4 py-12 flex flex-col gap-6">
			<div>
				<Link to="/profile">
					<Button
						variant="outline"
						className="p-1 px-2 text-muted hover:text-foreground text-sm flex items-center gap-1 cursor-pointer rounded-lg h-8"
					>
						<ArrowLeft className="size-4" /> Back to Profile
					</Button>
				</Link>
			</div>

			<Surface className="w-full p-8 backdrop-blur-md rounded-2xl border border-border/40 flex flex-col gap-6 ">
				<div className="flex items-center justify-between border-b border-border/10 pb-5">
					<div className="flex flex-col gap-1">
						<span className="text-[10px] text-muted uppercase tracking-wider font-bold">
							Team Creation Request
						</span>
						<h1 className="text-2xl font-black tracking-tight">
							{req.teamName}
						</h1>
					</div>
					<StatusBadge
						status={req.status === "processed" ? "approved" : req.status}
					/>
				</div>

				<div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm mt-1">
					<div className="flex flex-col gap-1">
						<Label className="text-xs text-muted">User Group</Label>
						<span className="font-semibold text-foreground/90">
							{req.userGroup}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs text-muted">Admin Group</Label>
						<span className="font-semibold text-foreground/90">
							{req.adminGroup}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs text-muted">Contact Person</Label>
						<span className="font-semibold text-foreground/90">
							{req.contactName}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<Label className="text-xs text-muted">Contact Email</Label>
						<span className="font-semibold text-foreground/90">
							{req.contactEmail}
						</span>
					</div>
				</div>

				{req.comments && (
					<div className="p-4 rounded-xl bg-muted/10 border border-border/10 mt-2">
						<Label className="text-xs text-muted block mb-1">
							Comment / Feedback
						</Label>
						<p className="text-sm text-foreground/80 leading-relaxed">
							{req.comments}
						</p>
					</div>
				)}

				{(req.status === "approved" || req.status === "processed") && (
					<div className="mt-2 p-4 rounded-xl bg-success/5 border border-success/10 flex flex-col gap-2">
						<p className="text-sm text-success flex items-center gap-1.5 font-bold">
							🎉 Your team workspace is ready!
						</p>
						<Link to="/" className="w-full mt-1">
							<Button className="w-full font-bold bg-success text-white hover:bg-success/90 rounded-xl h-10">
								Go to Dashboard
							</Button>
						</Link>
					</div>
				)}

				{req.status === "pending" && (
					<div className="mt-2 p-4 rounded-xl bg-muted/10 border border-border/10 flex flex-col gap-1">
						<p className="text-xs text-muted">
							You will be notified once the admin approves your request.
						</p>
					</div>
				)}
			</Surface>
		</div>
	);
}

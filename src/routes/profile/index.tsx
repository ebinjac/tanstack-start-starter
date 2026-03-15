import { Avatar, Card, Chip, Separator } from "@heroui/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Briefcase, Key, Mail, ShieldAlert, UserCheck } from "lucide-react";
import { getTeamsByIdsFn } from "@/actions/teams.fn";

export const Route = createFileRoute("/profile/")({
	beforeLoad: ({ context }) => {
		if (!context.session) {
			throw redirect({ to: "/" });
		}
	},
	loader: async ({ context }) => {
		const session = context.session!;
		const teams = await getTeamsByIdsFn({ data: session.accessibleTeamIds });
		return { teams };
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = Route.useRouteContext();
	const { teams } = Route.useLoaderData();

	if (!session) return null;

	const initials = session.fullName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const adminTeams = teams.filter((t) => session.adminTeamIds.includes(t.id));
	const regularTeams = teams.filter(
		(t) => !session.adminTeamIds.includes(t.id),
	)

	return (
		<div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
			<div>
				<h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
					Account Profile
				</h1>
				<p className="text-muted text-medium">
					View your identity attributes and active team memberships.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Left Section: User details card */}
				<div className="md:col-span-1">
					<Card className="backdrop-blur-md">
						<Card.Header className="flex flex-col items-center justify-center pt-8 pb-4">
							<Avatar className="size-24">
								<Avatar.Image
									src={`https://ui-avatars.com/api/?name=${encodeURIComponent(session.fullName)}&background=0284c7&color=fff`}
									alt={session.fullName}
								/>
								<Avatar.Fallback delayMs={600}>{initials}</Avatar.Fallback>
							</Avatar>
							<h2 className="mt-4 text-xl font-bold text-center">
								{session.fullName}
							</h2>
							<span className="text-xs text-muted flex items-center gap-1 mt-1">
								<Briefcase className="size-3" /> ADS ID: {session.adsId}
							</span>
						</Card.Header>
						<Separator />
						<Card.Content className="flex flex-col gap-4 text-sm px-5 py-6">
							<div className="flex flex-col gap-1">
								<span className="text-muted text-xs font-semibold uppercase flex items-center gap-1">
									<Mail className="size-3" /> Email Address
								</span>
								<span className="font-medium">{session.email}</span>
							</div>

							<div className="flex flex-col gap-1">
								<span className="text-muted text-xs font-semibold uppercase flex items-center gap-1">
									<UserCheck className="size-3" /> Employee ID
								</span>
								<span className="font-medium">{session.employeeId}</span>
							</div>

							<div className="flex flex-col gap-1">
								<span className="text-muted text-xs font-semibold uppercase flex items-center gap-1">
									<Key className="size-3" /> Unique Identity
								</span>
								<span className="font-mono text-xs break-all bg-default px-2 py-1 rounded-sm mt-1">
									{session.userId}
								</span>
							</div>
						</Card.Content>
					</Card>
				</div>

				{/* Right Section: Teams cards */}
				<div className="md:col-span-2 flex flex-col gap-6">
					{/* Admin Teams */}
					<Card>
						<Card.Header className="flex gap-2 items-center px-6 pt-5">
							<ShieldAlert className="size-5 text-accent" />
							<div className="flex flex-col">
								<h3 className="font-bold text-base">Administered Teams</h3>
								<p className="text-xs text-muted">
									Teams you manage with administrative privileges
								</p>
							</div>
						</Card.Header>
						<Separator className="my-2" />
						<Card.Content className="px-6 pb-5">
							{adminTeams.length === 0 ? (
								<p className="text-sm text-muted italic">
									You do not administer any teams.
								</p>
							) : (
								<div className="flex flex-col gap-2">
									{adminTeams.map((team) => (
										<div
											key={team.id}
											className="flex justify-between items-center p-3 border border-border rounded-lg bg-surface-secondary"
										>
											<div>
												<p className="font-semibold text-sm">{team.teamName}</p>
												<p className="text-xs text-muted">
													Contact: {team.contactName} ({team.contactEmail})
												</p>
											</div>
											<Chip color="success" size="sm" variant="soft">
												Admin
											</Chip>
										</div>
									))}
								</div>
							)}
						</Card.Content>
					</Card>

					{/* Member Teams */}
					<Card>
						<Card.Header className="flex gap-2 items-center px-6 pt-5">
							<Briefcase className="size-5 text-accent" />
							<div className="flex flex-col">
								<h3 className="font-bold text-base">Team Memberships</h3>
								<p className="text-xs text-muted">
									Teams where you have standard viewer permissions
								</p>
							</div>
						</Card.Header>
						<Separator className="my-2" />
						<Card.Content className="px-6 pb-5">
							{regularTeams.length === 0 ? (
								<p className="text-sm text-muted italic">
									No standard team memberships.
								</p>
							) : (
								<div className="flex flex-col gap-2">
									{regularTeams.map((team) => (
										<div
											key={team.id}
											className="flex justify-between items-center p-3 border border-border rounded-lg bg-surface-secondary"
										>
											<div>
												<p className="font-semibold text-sm">{team.teamName}</p>
												<p className="text-xs text-muted">
													Contact: {team.contactName}
												</p>
											</div>
											<Chip color="accent" size="sm" variant="soft">
												Member
											</Chip>
										</div>
									))}
								</div>
							)}
						</Card.Content>
					</Card>
				</div>
			</div>
		</div>
	)
}

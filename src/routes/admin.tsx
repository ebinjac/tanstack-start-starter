import { Chip, Spinner } from "@heroui/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart3, Clock, ShieldCheck, Users } from "lucide-react";
import { Suspense } from "react";
import { getAllTeamsAdminFn, getPendingTeamRequestsFn } from "@/actions/teams.fn";
import { Profile } from "@/components/profile";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	Sidebar,
	SidebarBrand,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const pendingRequestsQueryOptions = () =>
	queryOptions({
		queryKey: ["admin", "pendingRequests"],
		queryFn: () => getPendingTeamRequestsFn(),
	});

export const allTeamsQueryOptions = () =>
	queryOptions({
		queryKey: ["admin", "allTeams"],
		queryFn: () => getAllTeamsAdminFn(),
	});


export const Route = createFileRoute("/admin")({
	beforeLoad: ({ context }) => {
		if (!context.session) {
			throw redirect({ to: "/" });
		}
	},
	loader: ({ context }) => {
		// Non-blocking prefetch triggered immediately at the layout level
		context.queryClient.prefetchQuery(pendingRequestsQueryOptions());
	},
	component: AdminComponent,
});

function SidebarFooterContent() {
	const { open } = useSidebar();
	return (
		<SidebarFooter>
			<ThemeToggle className={cn(!open && "flex-col p-1 gap-1 rounded-2xl")} />
			<Profile />
		</SidebarFooter>
	);
}

function SidebarBadgeCounter() {
	const { data: pendingRequests } = useSuspenseQuery(
		pendingRequestsQueryOptions(),
	);
	if (pendingRequests.length === 0) return null;
	return (
		<Chip size="sm" color="danger" variant="soft" className="font-bold">
			{pendingRequests.length}
		</Chip>
	);
}

function AdminComponent() {
	const location = useLocation();
	const navigate = useNavigate();

	const isDashboard = location.pathname === "/admin" || location.pathname === "/admin/";
	const isRequests = location.pathname === "/admin/requests";
	const isTeams = location.pathname === "/admin/teams";

	return (
		<SidebarProvider>
			<Sidebar>
				<SidebarHeader className="flex items-center justify-between">
					<SidebarBrand icon={<ShieldCheck className="size-6 text-accent" />}>
						Admin
					</SidebarBrand>
					<SidebarTrigger />
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel>Management</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuButton
									icon={<BarChart3 className="size-5" />}
									isActive={isDashboard}
									onClick={() => navigate({ to: "/admin" })}
								>
									Dashboard
								</SidebarMenuButton>

								<SidebarMenuButton
									icon={<Clock className="size-5" />}
									isActive={isRequests}
									onClick={() => navigate({ to: "/admin/requests" })}
									tooltip="Team Requests"
								>
									<div className="flex items-center justify-between w-full gap-2">
										<span>Team Requests</span>
										<Suspense fallback={null}>
											<SidebarBadgeCounter />
										</Suspense>
									</div>
								</SidebarMenuButton>

								<SidebarMenuButton
									icon={<Users className="size-5" />}
									isActive={isTeams}
									onClick={() => navigate({ to: "/admin/teams" })}
								>
									All Teams
								</SidebarMenuButton>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<div className="flex-1" />
					<SidebarFooterContent />
				</SidebarContent>
			</Sidebar>

			<main className="flex-1 overflow-y-auto p-8 bg-background/50">
				<Suspense
					fallback={
						<div className="flex h-full w-full items-center justify-center">
							<Spinner size="lg" color="accent" />
						</div>
					}
				>
					<Outlet />
				</Suspense>
			</main>
		</SidebarProvider>
	);
}


import { Avatar, Dropdown, Label, Separator } from "@heroui/react";
import { ArrowUpRightFromSquare, Clock, Settings, Users } from "lucide-react";
import { useRouteContext, useRouter } from "@tanstack/react-router";

export function Profile() {
	const { session } = useRouteContext({ from: "__root__" });
	const router = useRouter();
	const name = session?.fullName ?? "User";
	const email = session?.email ?? "";
	const initials = name
		.split(" ")
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const handleAction = (key: any) => {
		switch (key) {
			case "admin-dash":
				router.navigate({ to: "/admin" });
				break;
			case "profile":
				router.navigate({ to: "/profile" });
				break;
			case "my-requests":
				router.navigate({ to: "/profile/requests" });
				break;
			case "new-project":
				router.navigate({ to: "/teams/create" });
				break;
			case "logout":
				// Standard page redirects forwards logout routes
				window.location.href = "/"; 
				break;
		}
	};

	return (
		<Dropdown>
			<Dropdown.Trigger className="rounded-full">
				<Avatar className="cursor-pointer">
					<Avatar.Image
						alt={name}
						src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`}
					/>
					<Avatar.Fallback delayMs={600}>{initials}</Avatar.Fallback>
				</Avatar>
			</Dropdown.Trigger>
			<Dropdown.Popover className="w-56">
				<div className="px-3 pt-3 pb-1">
					<div className="flex items-center gap-2">
						<Avatar size="sm">
							<Avatar.Image
								alt={name}
								src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`}
							/>
							<Avatar.Fallback delayMs={600}>{initials}</Avatar.Fallback>
						</Avatar>
						<div className="flex flex-col gap-0 overflow-hidden">
							<p className="text-sm leading-5 font-bold text-foreground truncate">{name}</p>
							<p className="text-[11px] leading-none text-muted truncate">
								{email}
							</p>
						</div>
					</div>
				</div>
				<Separator className="mt-2 border-border/10" />
				<Dropdown.Menu onAction={handleAction} className="p-1">
					<Dropdown.Item id="admin-dash" textValue="Admin Dashboard">
						<div className="flex w-full items-center justify-between gap-2">
							<Label className="text-xs font-semibold">Admin Dashboard</Label>
						</div>
					</Dropdown.Item>
					<Dropdown.Item id="profile" textValue="Profile">
						<div className="flex w-full items-center justify-between gap-2">
							<Label className="text-xs font-semibold">Profile</Label>
						</div>
					</Dropdown.Item>
					<Dropdown.Item id="my-requests" textValue="My Requests">
						<div className="flex w-full items-center justify-between gap-2">
							<Label className="text-xs font-semibold">My Requests</Label>
							<Clock className="size-3.5 text-muted" />
						</div>
					</Dropdown.Item>
					<Dropdown.Item id="new-project" textValue="Create Team">
						<div className="flex w-full items-center justify-between gap-2">
							<Label className="text-xs font-semibold">Create Team</Label>
							<Users className="size-3.5 text-muted" />
						</div>
					</Dropdown.Item>
					<Dropdown.Item id="logout" textValue="Logout" className="text-danger hover:bg-danger/10">
						<div className="flex w-full items-center justify-between gap-2">
							<Label className="text-xs font-semibold text-danger">Log Out</Label>
							<ArrowUpRightFromSquare className="size-3.5 text-danger" />
						</div>
					</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown.Popover>
		</Dropdown>
	);
}


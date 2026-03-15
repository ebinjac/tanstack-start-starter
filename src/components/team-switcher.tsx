import type { Key } from "@heroui/react";
import {
	Avatar,
	Button,
	Description,
	Label,
	ListBox,
	Select,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { Plus, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { getTeamsByIdsFn } from "@/actions/teams.fn";

export function TeamSwitcher() {
	const { session } = useRouteContext({ from: "__root__" });
	const router = useRouter();

	const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

	const accessibleTeamIds = session?.accessibleTeamIds || [];

	// Fetch teams list using server function
	const { data: teams = [] } = useQuery({
		queryKey: ["my-teams", accessibleTeamIds],
		queryFn: () => getTeamsByIdsFn({ data: accessibleTeamIds }),
		enabled: accessibleTeamIds.length > 0,
	});

	useEffect(() => {
		if (accessibleTeamIds.length === 0) return;

		const stored = localStorage.getItem("selectedTeamId");
		if (stored && accessibleTeamIds.includes(stored)) {
			setSelectedTeamId(stored);
		} else {
			const fallback = accessibleTeamIds[0];
			setSelectedTeamId(fallback);
			localStorage.setItem("selectedTeamId", fallback);
		}
	}, [accessibleTeamIds]);

	const handleTeamChange = (value: any) => {
		if (!value) return;
		const keyStr = String(value);
		localStorage.setItem("selectedTeamId", keyStr);
		setSelectedTeamId(keyStr);
		router.invalidate();
	};

	if (accessibleTeamIds.length === 0) {
		return (
			<Button
				size="sm"
				className="rounded-xl px-4 h-9 text-xs font-bold active:scale-95 transition-all bg-accent text-white hover:bg-accent/90"
				onClick={() => router.navigate({ to: "/teams/create" })}
			>
				Get Started
			</Button>
		);
	}

	const activeTeam = teams.find((t: any) => t.id === selectedTeamId);

	return (
		<Select
			value={selectedTeamId}
			onChange={handleTeamChange}
			aria-label="Select Team"
			className="w-60"
		>
			<Select.Trigger className="group rounded-xl border border-border/30 bg-surface/40 h-10 flex items-center pr-2 pl-3 hover:border-border/60 hover:bg-surface/60 transition-colors focus:ring-2 focus:ring-accent/40 focus:border-accent cursor-pointer w-full">
				<Select.Value className="text-sm font-semibold flex-1 text-left">
					{activeTeam?.teamName || "Select Team"}
				</Select.Value>
				<Select.Indicator className="text-muted/40 group-hover:text-muted size-4 ml-auto" />
			</Select.Trigger>
			<Select.Popover className="w-64 mt-2">
				<ListBox className="p-1">
					{teams.map((team: any) => {
						const isSelected = team.id === selectedTeamId;
						const initials = team.teamName[0].toUpperCase();
						return (
							<ListBox.Item
								id={team.id}
								textValue={team.teamName}
								key={team.id}
								className={`
									flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer group transition-all h-14
									${isSelected ? "bg-accent/10 border border-accent/20" : "hover:bg-muted/40"}
								`}
							>
								<Avatar
									size="sm"
									className="rounded-full bg-accent/20 text-accent font-bold size-9 border border-border/10"
								>
									<Avatar.Image
										src={`https://ui-avatars.com/api/?name=${encodeURIComponent(team.teamName)}&background=0369a1&color=fff&bold=true`}
									/>
									<Avatar.Fallback>{initials}</Avatar.Fallback>
								</Avatar>

								<div className="flex flex-col flex-1 overflow-hidden">
									<Label className="text-xs font-bold truncate text-foreground/90">
										{team.teamName}
									</Label>
									<Description className="text-[10px] text-muted truncate">
										{team.userGroup}
									</Description>
								</div>

								<div className="flex items-center gap-1.5 pl-2 border-l border-border/10">
									<ListBox.ItemIndicator className="size-4 text-accent" />
									<Button
										size="sm"
										variant="tertiary"
										className="p-1 h-7 w-7 min-w-0 rounded-lg hover:bg-surface-secondary flex items-center justify-center shrink-0 active:scale-95 transition-all"
										onClick={(e) => {
											e.stopPropagation();
											router.navigate({ to: `/teams/${team.id}/settings` });
										}}
									>
										<Settings className="size-3.5 text-muted group-hover:text-foreground transition-colors" />
									</Button>
								</div>
							</ListBox.Item>
						);
					})}
				</ListBox>
				<div className="p-2 border-t border-border/10 bg-muted/5">
					<button
						type="button"
						className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-muted/30 transition-all active:scale-[0.98] group text-left cursor-pointer"
						onClick={() => router.navigate({ to: "/teams/create" })}
					>
						<div className="flex items-center justify-center size-9 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-all shrink-0">
							<Plus className="size-4" />
						</div>
						<div className="flex flex-col flex-1 overflow-hidden">
							<span className="text-xs font-bold text-foreground/90 group-hover:text-accent transition-colors">
								Add Another Team
							</span>
							<span className="text-[10px] text-muted truncate">
								Create a new workspace for your group
							</span>
						</div>
					</button>
				</div>
			</Select.Popover>
		</Select>
	);
}

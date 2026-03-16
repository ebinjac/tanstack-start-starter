import type { Key } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTeamsByIdsFn } from "@/actions/teams.fn";
import { queryKeys } from "@/lib/query-keys";

/**
 * Encapsulates team switcher data and side effects: fetches teams for accessible IDs,
 * syncs selected team with localStorage, and provides change handler that invalidates router.
 */
export function useTeamSwitcher() {
	const { session } = useRouteContext({ from: "__root__" });
	const router = useRouter();
	const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

	const accessibleTeamIds = session?.accessibleTeamIds ?? [];

	const { data: teams = [], isLoading: teamsLoading } = useQuery({
		queryKey: queryKeys.user.myTeams(accessibleTeamIds),
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

	const handleTeamChange = (value: Key) => {
		if (!value) return;
		const keyStr = String(value);
		localStorage.setItem("selectedTeamId", keyStr);
		setSelectedTeamId(keyStr);
		router.invalidate();
	};

	const activeTeam = teams.find((t) => t.id === selectedTeamId);
	const hasNoTeams = accessibleTeamIds.length === 0;

	return {
		teams,
		teamsLoading,
		selectedTeamId,
		activeTeam,
		hasNoTeams,
		handleTeamChange,
		router,
	};
}

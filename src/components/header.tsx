import { useRouterState } from "@tanstack/react-router";
import { EnsembleLogo } from "@/components/logo";
import { Navbar } from "@/components/navbar";
import { Profile } from "./profile";
import { ThemeToggle } from "./theme-toggle";

import { TeamSwitcher } from "./team-switcher";

export default function Header() {
	const router = useRouterState();

	if (router.location.pathname.startsWith("/admin")) {
		return null;
	}

	return (
		<div className="container mx-auto p-4 flex items-center justify-between">
			<div className=" text-2xl font-black flex gap-2 items-center">
				<EnsembleLogo />
				ensemble.
			</div>

			<Navbar />
			<div className=" flex gap-3 items-center">
				<TeamSwitcher />
				<ThemeToggle />
				<Profile />
			</div>
		</div>
	);
}


import { Button } from "@heroui/react";
import { Link, useRouteContext } from "@tanstack/react-router";
import {
	Activity,
	Box,
	ChevronDown,
	Link as LinkIcon,
	Settings,
	Users
} from "lucide-react";

const TOOL_CATEGORIES = [
	{
		title: "PORTAL TOOLS",
		items: [
			{
				label: "Scorecard",
				description: "Track performance metrics and analytics across the board.",
				to: "/tools/scorecard",
				icon: Activity,
			},
			{
				label: "TO-HUB",
				description: "Centralized hub for unified operational workflows.",
				to: "/tools/to-hub",
				icon: Box,
			},
		],
	},
	{
		title: "MANAGEMENT",
		items: [
			{
				label: "Link Manager",
				description: "Create, monitor, and organize your short links securely.",
				to: "/tools/link-manager",
				icon: LinkIcon,
			},
			{
				label: "Envmatrix",
				description: "Configure and manage environment variable matrices.",
				to: "/tools/envmatrix",
				icon: Settings,
			},
		],
	},
];

export function Navbar() {
	const { session } = useRouteContext({ from: "__root__" });
	const hasTeams = (session?.accessibleTeamIds || []).length > 0;

	return (
		<nav className="h-14 px-6 flex items-center justify-between bg-background z-50 relative">
			<div className="flex items-center h-full">
				
				{/* Tools Mega Menu Trigger */}
				<div className="group h-full flex items-center">
					<Button variant="ghost" className="text-foreground px-2 hover:bg-none">
						Tools
						<ChevronDown
							size={14}
							className="transition-transform duration-200 group-hover:rotate-180"
						/>
					</Button>

					{/* INVISIBLE WRAPPER: 
						Starts exactly at top-14 to keep the hover state active (the bridge).
						pt-3 adds a 12px visual gap before the visible menu starts.
					*/}
					<div className="fixed top-14 left-0 w-screen hidden group-hover:block z-50 pt-3">
						
						{/* ACTUAL VISIBLE MENU: 
							Background, borders, and shadows are moved here so the gap above remains transparent.
						*/}
						<div className="w-full bg-surface border-y border-border border-dashed  flex justify-center">
							<div className="w-full max-w-6xl flex">
								
								{/* Left Side - Tool List */}
								<div className="flex-[2] p-8 grid grid-cols-2 gap-x-8 gap-y-6">
									{TOOL_CATEGORIES.map((category) => (
										<div key={category.title} className="flex flex-col gap-4">
											<h4 className="text-xs font-semibold tracking-wider text-accent uppercase">
												{category.title}
											</h4>
											<div className="flex flex-col gap-2">
												{category.items.map((tool) => (
													<Link
														key={tool.to}
														to={tool.to}
														className="flex items-start gap-4 p-3 -ml-3 rounded-lg hover:bg-surface-secondary transition-colors"
														activeProps={{
															className: "bg-surface-secondary",
														}}
													>
														<div className="p-2 rounded-md bg-background border border-border flex-shrink-0 mt-0.5">
															<tool.icon size={16} className="text-foreground" />
														</div>
														<div className="flex flex-col">
															<span className="text-sm font-medium text-foreground">
																{tool.label}
															</span>
															<span className="text-xs text-muted mt-0.5 leading-relaxed">
																{tool.description}
															</span>
														</div>
													</Link>
												))}
											</div>
										</div>
									))}
								</div>

								{/* Right Side - Featured / Create Team */}
								<div className="flex-[1] relative p-8 bg-surface-secondary border-l border-border overflow-hidden flex flex-col justify-center">
									{/* Decorative Background */}
									<div className="absolute top-[-20%] right-[-20%] w-[150%] h-[150%] bg-accent blur-3xl rounded-full pointer-events-none" />
									
									<div className="relative z-10 flex flex-col gap-3">
										<div className="w-10 h-10 mb-2 flex items-center justify-center rounded-lg bg-surface border border-border text-foreground shadow-sm">
											<Users size={20} />
										</div>
										<h3 className="text-lg font-semibold text-white">
											{hasTeams ? "Manage Organization" : "Create a New Team"}
										</h3>
										<p className="text-sm text-white/90 leading-relaxed mb-4">
											{hasTeams 
												? "Access your dashboard to manage team resources, deployment models, and coordinate workspace activities." 
												: "Set up a dedicated workspace to collaborate, manage resources, and deploy tools for your organization."}
										</p>
										<Link to={hasTeams ? "/admin" : "/teams/create"} className="w-fit">
											<Button className="w-fit bg-foreground text-background font-semibold active:scale-95 transition-all">
												{hasTeams ? "Go to Dashboard" : "Get started"}
											</Button>
										</Link>
									</div>
								</div>

							</div>
						</div>
					</div>
				</div>

				{/* Standard Nav Links */}
				<div className="hidden md:flex items-center gap-1 ml-4 h-full">
					{[
						{ label: "About", to: "/about" },
						{ label: "Docs", to: "/docs" },
						{ label: "Contact", to: "/contact" },
					].map((item) => (
						<Link
							key={item.to}
							to={item.to}
							className="px-3 py-1.5 text-sm text-muted hover:text-foreground hover:bg-surface-secondary rounded-md transition-colors"
							activeProps={{ className: "text-foreground bg-surface-secondary" }}
						>
							{item.label}
						</Link>
					))}
				</div>
			</div>
		</nav>
	);
}
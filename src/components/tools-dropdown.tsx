import { Button, Link, Popover } from "@heroui/react";
import {
	ArrowUpRight,
	ChevronDown,
	Layers,
	LayoutDashboard,
	Link2,
	RefreshCcw,
} from "lucide-react";
import { useRef, useState } from "react";

export function ToolsDropdown() {
	// Mock teamId for now, can be passed as a prop later
	const teamId = null;

	const [isOpen, setIsOpen] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleMouseEnter = () => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		setIsOpen(true);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = setTimeout(() => {
			setIsOpen(false);
		}, 300);
	};

	const tools = [
		{
			title: "Scorecard",
			href: teamId ? `/teams/${teamId}/scorecard` : "/scorecard",
			description: "Real-time performance metrics and health monitoring.",
			icon: LayoutDashboard,
		},
		{
			title: "TO - HUB",
			href: teamId ? `/teams/${teamId}/turnover` : "/turnover",
			description: "Seamless shift handovers and transition tracking.",
			icon: RefreshCcw,
		},
		{
			title: "Link Manager",
			href: teamId ? `/teams/${teamId}/link-manager` : "/link-manager",
			description: "Centralized repository for all your documentation.",
			icon: Link2,
		},
		{
			title: "EnvMatrix",
			href: teamId ? `/teams/${teamId}/envmatrix` : "/envmatrix",
			description: "Track versions across environments effortlessly.",
			icon: Layers,
		},
	];

	return (
		// biome-ignore lint: Hover trigger wrapper for the popover
		<div
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			className="h-full flex items-center"
		>
			<Popover isOpen={isOpen} onOpenChange={setIsOpen}>
				<Popover.Trigger>
					<button
						type="button"
						className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors h-auto min-w-0 bg-transparent flex items-center gap-1 group data-[open=true]:text-foreground cursor-pointer outline-none border-none"
					>
						tools
						<ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[open=true]:rotate-180" />
					</button>
				</Popover.Trigger>
				<Popover.Content
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					placement="bottom start"
					offset={12}
					className="w-[840px] p-0 overflow-hidden rounded-2xl border border-divider bg-background shadow-2xl"
				>
					<Popover.Dialog className="flex outline-none">
						{/* Left Side: Products Section */}
						<div className="flex-1 p-8 border-r border-divider bg-background">
							<div className="text-[10px] font-bold tracking-[0.2em] text-foreground/30 mb-8 uppercase">
								Products {"//"}
							</div>
							<div className="grid grid-cols-2 gap-x-12 gap-y-10">
								{tools.map((tool) => (
									<Link
										key={tool.title}
										href={tool.href}
										className="group flex flex-col gap-3 no-underline transition-all duration-300"
									>
										<div className="flex justify-between items-start w-full">
											<div className="p-2.5 bg-default-100 rounded-xl group-hover:bg-foreground group-hover:text-background transition-all duration-300 shadow-sm">
												<tool.icon className="h-5 w-5" />
											</div>
											<ArrowUpRight className="h-4 w-4 text-foreground/10 group-hover:text-foreground/40 transition-colors" />
										</div>
										<div className="space-y-1.5">
											<div className="font-bold text-base text-foreground tracking-tight">
												{tool.title}
											</div>
											<p className="text-sm text-foreground/40 leading-relaxed font-medium">
												{tool.description}
											</p>
										</div>
									</Link>
								))}
							</div>
						</div>

						{/* Right Side: Showcase Section */}
						<div className="w-[320px] bg-default-50/50 p-8 flex flex-col">
							<div className="text-[10px] font-bold tracking-[0.2em] text-foreground/30 mb-8 uppercase">
								Highlights {"//"}
							</div>
							<div className="flex-1">
								<div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-divider bg-background shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
									{/* Now uses theme colors from your CSS */}
									<div className="aspect-[4/3] bg-gradient-to-br from-[var(--accent)] to-black/40 flex items-center justify-center relative overflow-hidden">
										<div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white,_transparent)] animate-pulse" />
										<div className="text-white font-black text-3xl tracking-tighter italic z-10 drop-shadow-2xl">
											ENSEMBLE
										</div>
										<div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
									</div>
									<div className="p-5">
										<div className="font-bold text-sm mb-2 transition-colors flex items-center justify-between text-[color:var(--accent)]">
											New Platform Launch
											<ArrowUpRight className="h-3 w-3" />
										</div>
										<p className="text-xs text-foreground/50 leading-relaxed font-medium">
											Experience the all-new unified dashboard for enterprise
											operations.
										</p>
									</div>
								</div>
							</div>
							<div className="mt-6 pt-6 border-t border-divider">
								<Button
									variant="tertiary"
									size="sm"
									className="w-full font-bold text-xs uppercase tracking-widest py-5 rounded-xl border border-divider bg-background hover:bg-foreground hover:text-background transition-all duration-300"
								>
									View Roadmap
								</Button>
							</div>
						</div>
					</Popover.Dialog>
				</Popover.Content>
			</Popover>
		</div>
	);
}

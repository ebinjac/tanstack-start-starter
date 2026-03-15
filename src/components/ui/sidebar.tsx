import { Tooltip } from "@heroui/react";
import { Menu } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SidebarContextType = {
	open: boolean;
	setOpen: (open: boolean) => void;
	toggleSidebar: () => void;
	isMobile: boolean;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(true);
	const [isMobile, setIsMobile] = useState(false);

	const toggleSidebar = () => setOpen((prev) => !prev);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024);
			if (window.innerWidth < 1024) {
				setOpen(false);
			} else {
				setOpen(true);
			}
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return (
		<SidebarContext.Provider value={{ open, setOpen, toggleSidebar, isMobile }}>
			<div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
				{children}
			</div>
		</SidebarContext.Provider>
	);
}

export function Sidebar({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	const { open, isMobile, setOpen } = useSidebar();

	return (
		<>
			{isMobile && open && (
				<div
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
					onClick={() => setOpen(false)}
					onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
					role="button"
					tabIndex={0}
					aria-label="Close Sidebar"
				/>
			)}

			<aside
				className={cn(
					"flex flex-col h-full border-r border-border/40 bg-surface text-foreground transition-all duration-300 ease-in-out shrink-0 sticky top-0 left-0 z-40 overflow-x-hidden",
					isMobile
						? cn(
								"fixed inset-y-0 left-0 w-64 transform",
								open ? "translate-x-0" : "-translate-x-full",
							)
						: open
							? "w-64"
							: "w-16",
					className ?? "",
				)}
			>
				{children}
			</aside>
		</>
	);
}

export function SidebarBrand({
	children,
	icon,
	className,
}: {
	children: React.ReactNode;
	icon?: React.ReactNode;
	className?: string;
}) {
	const { open } = useSidebar();
	return (
		<div
			className={cn(
				"flex items-center gap-2 font-black text-xl tracking-tight whitespace-nowrap overflow-hidden",
				className ?? "",
			)}
		>
			{icon && (
				<div className="flex shrink-0 items-center justify-center size-6">
					{icon}
				</div>
			)}
			<span
				className={cn(
					"transition-all duration-200 ease-in-out origin-left flex items-center",
					open
						? "opacity-100 scale-100"
						: "opacity-0 scale-50 w-0 overflow-hidden",
				)}
			>
				{children}
			</span>
		</div>
	);
}

// Containers
export function SidebarHeader({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"p-4 border-b border-border/20 flex shrink-0 items-center justify-between",
				className ?? "",
			)}
		>
			{children}
		</div>
	);
}

export function SidebarContent({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-5 scrollbar-thin",
				className ?? "",
			)}
		>
			{children}
		</div>
	);
}

export function SidebarFooter({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	const { open } = useSidebar();
	return (
		<div
			className={cn(
				"p-4 border-t border-border/20 flex shrink-0 items-center justify-between gap-3",
				!open && "flex-col justify-center px-1 py-3",
				className ?? "",
			)}
		>
			{children}
		</div>
	);
}

// Groups
export function SidebarGroup({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("flex flex-col gap-1.5", className ?? "")}>
			{children}
		</div>
	);
}

export function SidebarGroupLabel({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	const { open } = useSidebar();
	return (
		<div
			className={cn(
				"px-3 text-xs font-bold tracking-wider text-muted/60 uppercase transition-all",
				!open && "opacity-0 h-0 overflow-hidden px-0",
				className ?? "",
			)}
		>
			{children}
		</div>
	);
}

export function SidebarGroupContent({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("flex flex-col gap-1", className ?? "")}>{children}</div>
	);
}

// Menu Components
export function SidebarMenu({ children }: { children: React.ReactNode }) {
	return <nav className="flex flex-col gap-1 w-full">{children}</nav>;
}

export function SidebarMenuButton({
	children,
	icon,
	isActive,
	className,
	tooltip,
	...props
}: {
	children: React.ReactNode;
	icon?: React.ReactNode;
	isActive?: boolean;
	className?: string;
	tooltip?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const { open } = useSidebar();
	const content =
		tooltip || (typeof children === "string" ? children : "Menu Item");

	return (
		<Tooltip isDisabled={open}>
			<Tooltip.Trigger>
				<button
					type="button"
					className={cn(
						"group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer",
						"text-muted hover:text-foreground hover:bg-muted/30",
						isActive &&
							"bg-accent/10 text-foreground font-bold hover:bg-accent/15",
						!open && "justify-center px-1 py-3",
					)}
					{...props}
				>
					{icon && (
						<div
							className={cn(
								"flex shrink-0 items-center justify-center w-5 h-5 [&_svg]:size-4 transition-all",
								!open && "scale-90",
							)}
						>
							{icon}
						</div>
					)}
					<span
						className={cn(
							"transition-all duration-200 origin-left flex items-center",
							open
								? "opacity-100 scale-100"
								: "opacity-0 scale-50 w-0 overflow-hidden",
							!open && "hidden",
						)}
					>
						{children}
					</span>
				</button>
			</Tooltip.Trigger>
			<Tooltip.Content placement="right">
				<Tooltip.Arrow />
				{content}
			</Tooltip.Content>
		</Tooltip>
	);
}

export function SidebarTrigger({ className }: { className?: string }) {
	const { toggleSidebar } = useSidebar();
	return (
		<button
			type="button"
			onClick={toggleSidebar}
			className={cn(
				"p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-muted hover:text-foreground transition-colors border border-border/10",
				className ?? "",
			)}
			aria-label="Toggle Sidebar"
		>
			<Menu className="size-5" />
		</button>
	);
}

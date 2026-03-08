import { Avatar, Button, Dropdown, Link } from "@heroui/react";
import { ThemeToggle } from "./theme-toggle";
import { ToolsDropdown } from "./tools-dropdown";

export function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur-md">
			<div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
				<div className="flex items-center gap-8">
					<Link
						href="/"
						className="font-bold text-xl tracking-tight no-underline text-foreground"
					>
						ensemble
					</Link>
					<nav className="hidden md:flex items-center gap-6">
						<ToolsDropdown />
						<Link
							href="/about"
							className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
						>
							about
						</Link>
						<Link
							href="/docs"
							className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
						>
							docs
						</Link>
						<Link
							href="/support"
							className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
						>
							support
						</Link>
					</nav>
				</div>

				<div className="flex items-center gap-4">
					<ThemeToggle />
					<Dropdown>
						<Dropdown.Trigger>
							<Button
								variant="tertiary"
								className="p-0 min-w-10 h-10 rounded-full overflow-hidden border"
							>
								<Avatar size="sm">
									<Avatar.Image src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
									<Avatar.Fallback>JD</Avatar.Fallback>
								</Avatar>
							</Button>
						</Dropdown.Trigger>
						<Dropdown.Popover>
							<Dropdown.Menu aria-label="Profile Actions">
								<Dropdown.Item key="profile" className="h-14 gap-2">
									<div className="flex flex-col">
										<p className="font-semibold text-sm">Signed in as</p>
										<p className="font-semibold text-xs text-foreground/60">
											zoey@example.com
										</p>
									</div>
								</Dropdown.Item>
								<Dropdown.Section>
									<Dropdown.Item key="settings">My Settings</Dropdown.Item>
									<Dropdown.Item key="team_settings">
										Team Settings
									</Dropdown.Item>
									<Dropdown.Item key="analytics">Analytics</Dropdown.Item>
								</Dropdown.Section>
								<Dropdown.Section>
									<Dropdown.Item key="system">System</Dropdown.Item>
									<Dropdown.Item key="configurations">
										Configurations
									</Dropdown.Item>
									<Dropdown.Item key="help_and_feedback">
										Help & Feedback
									</Dropdown.Item>
								</Dropdown.Section>
								<Dropdown.Item key="logout" className="text-danger">
									Log Out
								</Dropdown.Item>
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>
				</div>
			</div>
		</header>
	);
}

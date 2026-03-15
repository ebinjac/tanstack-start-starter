import { Button } from "@heroui/react";
import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
			{/* Aesthetic Background Gradient Sphere */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[var(--accent)] opacity-10 blur-3xl rounded-full pointer-events-none -z-10" />

			<h1 className="text-8xl font-black text-accent">404</h1>
			<p className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
				Page Not Found
			</p>
			<p className="mt-2 text-base text-muted max-w-md">
				Sorry, we couldn’t find the page you’re looking for. It might have been
				moved or deleted.
			</p>

			<div className="mt-8">
				<Link to="/">
					<Button>
						<Home className="size-4 mr-1" />
						Back to Home
					</Button>
				</Link>
			</div>
		</div>
	);
}

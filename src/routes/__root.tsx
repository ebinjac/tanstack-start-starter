import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";
import { getSessionFn } from "#/actions/auth.fn";
import { AuthGuard } from "#/components/auth-guard";
import Header from "#/components/header";
import { NotFound } from "#/components/not-found";
import type { SessionUser } from "#/lib/zod/auth.schema";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	session: SessionUser | null;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		const session = await getSessionFn();
		return { session };
	},
	notFoundComponent: NotFound,
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "TanStack Start Starter",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="font-sans antialiased bg-background text-foreground [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<TanStackQueryProvider>
						<Header />
						<AuthGuard>{children}</AuthGuard>
						<TanStackDevtools
							config={{
								position: "bottom-right",
							}}
							plugins={[
								{
									name: "Tanstack Router",
									render: <TanStackRouterDevtoolsPanel />,
								},
								TanStackQueryDevtools,
							]}
						/>
					</TanStackQueryProvider>
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}

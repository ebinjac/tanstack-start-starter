/**
 * Shared mocks for TanStack Router in tests.
 * Use: vi.mock("@tanstack/react-router", () => ({ default: mockRouter, ...mockRouter }));
 * Then override specific hooks per test: vi.mocked(Route.useLoaderData).mockReturnValue(...)
 */
import { createElement, type ReactNode } from "react";
import { vi } from "vitest";

export function createFileRouteMock(
	useLoaderData = vi.fn(),
	useSearch = vi.fn(),
	useParams = vi.fn(),
) {
	return (_path: string) => (opts: Record<string, unknown>) => ({
		...opts,
		useLoaderData,
		useSearch,
		useParams,
	});
}

export const mockRouter = {
	createFileRoute: createFileRouteMock(),
	Link: ({ children, to }: { children: ReactNode; to: string }) =>
		createElement("a", { href: to }, children),
	useRouter: () => ({ navigate: vi.fn() }),
	useLocation: () => ({ pathname: "/" }),
	useNavigate: () => vi.fn(),
	Outlet: () => null,
	redirect: vi.fn((opts: { to: string }) => {
		throw new Error(`Redirect to ${opts.to}`);
	}),
};

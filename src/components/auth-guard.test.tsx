import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { useSessionBootstrap } from "@/hooks";
import { AuthGuard } from "./auth-guard";

vi.mock("@/hooks", () => ({
	useSessionBootstrap: vi.fn(),
}));

describe("AuthGuard", () => {
	beforeEach(() => {
		vi.mocked(useSessionBootstrap).mockReset();
	});

	it("renders children when sessionReady is true", () => {
		vi.mocked(useSessionBootstrap).mockReturnValue({ sessionReady: true } as ReturnType<
			typeof useSessionBootstrap
		>);
		render(
			<AuthGuard>
				<span>Protected content</span>
			</AuthGuard>,
		);
		expect(screen.getByText("Protected content")).toBeInTheDocument();
	});

	it("renders nothing when sessionReady is false", () => {
		vi.mocked(useSessionBootstrap).mockReturnValue({ sessionReady: false } as ReturnType<
			typeof useSessionBootstrap
		>);
		const { container } = render(
			<AuthGuard>
				<span>Protected content</span>
			</AuthGuard>,
		);
		expect(container.firstChild).toBeNull();
		expect(within(container).queryByText("Protected content")).toBeNull();
	});
});

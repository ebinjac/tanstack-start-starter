import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./error-boundary";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

const ThrowError = () => {
	throw new Error("Test error");
};

describe("ErrorBoundary", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	it("renders children when there is no error", () => {
		render(
			<ErrorBoundary>
				<span>Child content</span>
			</ErrorBoundary>,
		);
		expect(screen.getByText("Child content")).toBeInTheDocument();
	});

	it("renders default error UI when child throws", () => {
		render(
			<ErrorBoundary>
				<ThrowError />
			</ErrorBoundary>,
		);
		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(screen.getByText("Test error")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
	});

	it("renders custom fallback when provided", () => {
		const { container } = render(
			<ErrorBoundary fallback={<div>Custom fallback</div>}>
				<ThrowError />
			</ErrorBoundary>,
		);
		const scope = within(container);
		expect(scope.getByText("Custom fallback")).toBeInTheDocument();
		expect(scope.queryByText("Something went wrong")).not.toBeInTheDocument();
	});

	it("Try Again resets and re-renders child so error UI appears again", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<ErrorBoundary>
				<ThrowError />
			</ErrorBoundary>,
		);
		const scope = within(container);
		expect(scope.getByRole("button", { name: /try again/i })).toBeInTheDocument();
		await user.click(scope.getByRole("button", { name: /try again/i }));
		// After reset, ThrowError is rendered again and throws, so error UI is still shown
		expect(scope.getByRole("button", { name: /try again/i })).toBeInTheDocument();
	});
});

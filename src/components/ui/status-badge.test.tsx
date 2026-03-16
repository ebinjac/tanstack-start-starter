import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
	it("renders pending status", () => {
		render(<StatusBadge status="pending" />);
		expect(screen.getByText(/pending/i)).toBeInTheDocument();
	});

	it("renders approved status", () => {
		render(<StatusBadge status="approved" />);
		expect(screen.getByText(/approved/i)).toBeInTheDocument();
	});

	it("renders rejected status", () => {
		render(<StatusBadge status="rejected" />);
		expect(screen.getByText(/rejected/i)).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(<StatusBadge status="pending" className="custom" />);
		const el = container.firstChild as HTMLElement;
		expect(el.className).toContain("custom");
	});
});

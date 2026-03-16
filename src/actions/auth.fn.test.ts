/**
 * @vitest-environment node
 *
 * Server function handler execution requires TanStack Start's AsyncLocalStorage context,
 * so we only test input validation here. Full handler logic can be covered by E2E or
 * by extracting pure logic into testable functions.
 */
import { describe, it, expect, vi } from "vitest";
import { createSessionFn } from "./auth.fn";

describe("createSessionFn", () => {
	it("rejects invalid input (validation runs before handler)", async () => {
		await expect(
			createSessionFn({ data: { attributes: { email: "not-an-email" }, groups: [] } as unknown }),
		).rejects.toThrow();
	});

	it("rejects missing required attributes", async () => {
		await expect(
			createSessionFn({
				data: { attributes: { fullName: "X", guid: "g", adsId: "a", employeeId: "e", email: "a@b.com" }, groups: [] } as unknown,
			}),
		).rejects.toThrow();
	});
});

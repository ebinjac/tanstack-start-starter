/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runWithDb, runMutation } from "./run";

vi.mock("@/lib/log", () => ({
	getRequestLogger: () => ({ error: vi.fn() }),
}));

describe("runWithDb", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns result when fn resolves", async () => {
		const result = await runWithDb(
			() => Promise.resolve(42),
			{ fallback: 0, logContext: "test" },
		);
		expect(result).toBe(42);
	});

	it("returns fallback when fn throws", async () => {
		const result = await runWithDb(
			() => Promise.reject(new Error("db error")),
			{ fallback: [], logContext: "fetch failed" },
		);
		expect(result).toEqual([]);
	});

	it("returns fallback for non-array fallback type", async () => {
		const result = await runWithDb(
			() => Promise.reject(new Error("err")),
			{ fallback: null, logContext: "test" },
		);
		expect(result).toBeNull();
	});
});

describe("runMutation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns result when fn resolves", async () => {
		const result = await runMutation(
			() => Promise.resolve({ id: "1" }),
			{ errorMessage: "Failed" },
		);
		expect(result).toEqual({ id: "1" });
	});

	it("throws Error with original message when fn throws Error", async () => {
		await expect(
			runMutation(
				() => Promise.reject(new Error("unique violation")),
				{ errorMessage: "Safe message" },
			),
		).rejects.toThrow("unique violation");
	});

	it("throws Error with errorMessage when fn throws non-Error", async () => {
		await expect(
			runMutation(
				() => Promise.reject("string error"),
				{ errorMessage: "Safe message" },
			),
		).rejects.toThrow("Safe message");
	});
});

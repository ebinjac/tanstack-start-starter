import { describe, it, expect } from "vitest";
import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
	describe("admin", () => {
		it("has stable base and derived keys", () => {
			expect(queryKeys.admin.all).toEqual(["admin"]);
			expect(queryKeys.admin.pendingRequests()).toEqual(["admin", "pendingRequests"]);
			expect(queryKeys.admin.allTeams()).toEqual(["admin", "allTeams"]);
			expect(queryKeys.admin.requestStats()).toEqual(["admin", "requestStats"]);
		});
	});

	describe("teams", () => {
		it("builds byIds with array reference", () => {
			const ids = ["a", "b"];
			expect(queryKeys.teams.byIds(ids)).toEqual(["teams", "byIds", ["a", "b"]]);
		});

		it("builds requestById with id", () => {
			expect(queryKeys.teams.requestById("req-1")).toEqual(["teams", "requestById", "req-1"]);
		});

		it("builds checkName with name", () => {
			expect(queryKeys.teams.checkName("My Team")).toEqual(["teams", "checkName", "My Team"]);
		});

		it("myRequests returns stable key", () => {
			expect(queryKeys.teams.myRequests()).toEqual(["teams", "myRequests"]);
		});
	});

	describe("user", () => {
		it("builds myTeams with teamIds", () => {
			expect(queryKeys.user.myTeams(["t1", "t2"])).toEqual(["user", "myTeams", ["t1", "t2"]]);
		});
	});
});

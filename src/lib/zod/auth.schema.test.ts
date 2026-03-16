import { describe, it, expect } from "vitest";
import { ssoUserSchema, sessionUserSchema } from "./auth.schema";

const validSsoPayload = {
	attributes: {
		firstName: "Jane",
		lastName: "Doe",
		fullName: "Jane Doe",
		adsId: "ads-123",
		guid: "guid-456",
		employeeId: "emp-789",
		email: "jane@example.com",
	},
	groups: ["group-a", "group-b"],
};

const validSessionPayload = {
	userId: "user-1",
	adsId: "ads-123",
	email: "jane@example.com",
	fullName: "Jane Doe",
	employeeId: "emp-789",
	groups: ["group-a"],
	accessibleTeamIds: [
		"550e8400-e29b-41d4-a716-446655440000",
		"6ba7b810-9dad-11d1-80b4-00c04fd430c8",
	],
	adminTeamIds: ["550e8400-e29b-41d4-a716-446655440000"],
	iat: Math.floor(Date.now() / 1000),
	exp: Math.floor(Date.now() / 1000) + 3600,
};

describe("ssoUserSchema", () => {
	it("parses valid SSO payload", () => {
		const result = ssoUserSchema.parse(validSsoPayload);
		expect(result.attributes.fullName).toBe("Jane Doe");
		expect(result.groups).toEqual(["group-a", "group-b"]);
	});

	it("accepts optional picture URL", () => {
		const withPicture = {
			...validSsoPayload,
			attributes: { ...validSsoPayload.attributes, picture: "https://example.com/photo.jpg" },
		};
		const result = ssoUserSchema.parse(withPicture);
		expect(result.attributes.picture).toBe("https://example.com/photo.jpg");
	});

	it("throws on invalid email", () => {
		expect(() =>
			ssoUserSchema.parse({
				...validSsoPayload,
				attributes: { ...validSsoPayload.attributes, email: "not-an-email" },
			}),
		).toThrow();
	});

	it("throws on missing required attribute", () => {
		const { fullName: _, ...attrs } = validSsoPayload.attributes;
		expect(() => ssoUserSchema.parse({ attributes: attrs, groups: [] })).toThrow();
	});

	it("throws on empty fullName", () => {
		expect(() =>
			ssoUserSchema.parse({
				...validSsoPayload,
				attributes: { ...validSsoPayload.attributes, fullName: "" },
			}),
		).toThrow();
	});
});

describe("sessionUserSchema", () => {
	it("parses valid session payload", () => {
		const result = sessionUserSchema.parse(validSessionPayload);
		expect(result.userId).toBe("user-1");
		expect(result.accessibleTeamIds).toHaveLength(2);
		expect(result.iat).toBeLessThanOrEqual(result.exp);
	});

	it("throws on invalid UUID in accessibleTeamIds", () => {
		expect(() =>
			sessionUserSchema.parse({
				...validSessionPayload,
				accessibleTeamIds: ["not-a-uuid"],
			}),
		).toThrow();
	});

	it("throws on missing exp", () => {
		const { exp: _, ...rest } = validSessionPayload;
		expect(() => sessionUserSchema.parse(rest)).toThrow();
	});
});
